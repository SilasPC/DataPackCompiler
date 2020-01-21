import { ASTFnNode } from "../../syntax/AST"
import { Scope } from "../Scope"
import { CompileContext } from "../../toolbox/CompileContext"
import { MaybeWrapper, Maybe } from "../../toolbox/Maybe"
import { FnDeclaration, DeclarationType, VarDeclaration } from "../Declaration"
import { ESR, ESRType, IntESR, getESRType } from "../ESR"
import { tokenToType, Type } from "../types/Types"
import { exhaust } from "../../toolbox/other"
import { parseBody } from "../parseBody"

export function parseFunction(node:ASTFnNode,scope:Scope,ctx:CompileContext,thisBinding:ESR|null) {
	const maybe = new MaybeWrapper<FnDeclaration>()

	let parameters: Maybe<{param:ESR,ref:boolean}>[] = []
	let branch = scope.branch(node.identifier.value,'FN',null)
	let fn = ctx.createFnFile(branch.getScopeNames(),[
		'Function definition for ' + branch.getScopeNames().join('::'),
		`Signature: ${node.getSignatureString()}`
	])
	let esr: ESR | null = null
	if (node.returnType) {
		let type = tokenToType(node.returnType,scope.symbols)

		switch (type.type) {
			case Type.VOID:
				esr = {type:ESRType.VOID, mutable: false, const: false, tmp: false}
				break
			case Type.INT:
				esr = {type:ESRType.INT, mutable: false, const: false, tmp: false, scoreboard: ctx.scoreboards.getStatic(branch.nameAppend('return'))}
				break
			case Type.BOOL:
				esr = {type:ESRType.BOOL, mutable: false, const: false, tmp: false, scoreboard: ctx.scoreboards.getStatic(branch.nameAppend('return'))}
				break
			case Type.SELECTOR:
				throw new Error('selector type not implemented')
			case Type.STRUCT:
				throw new Error('struct not ready')
			default:
				return exhaust(type)
		}
		branch.setReturnVar(esr)
	}

	let fndecl: FnDeclaration = {
		type: DeclarationType.FUNCTION,
		returns: esr,
		thisBinding,
		fn,
		parameters
	}

	if (thisBinding) {
		branch.symbols.declareThis(node.identifier,{
			type:DeclarationType.VARIABLE,
			esr:thisBinding,
			varType:getESRType(thisBinding)
		})
	}

	for (let param of node.parameters) {
		const maybe2 = new MaybeWrapper<{ref:boolean,param:ESR}>()
		let type = tokenToType(param.type,scope.symbols)
		let esr
		switch (type.type) {
			case Type.VOID:
				ctx.addError(param.type.error('not valid'))
				parameters.push(maybe2.none())
				continue
			case Type.INT:
				let iesr: IntESR = {
					type: ESRType.INT,
					scoreboard: ctx.scoreboards.getStatic(branch.nameAppend(param.symbol.value)),
					mutable: param.ref, // this controls if function parameters are mutable
					const: false,
					tmp: false
				}
				esr = iesr
				break
			case Type.BOOL:
				ctx.addError(param.type.error('no bool yet thx'))
				parameters.push(maybe2.none())
				continue
			case Type.SELECTOR:
				throw new Error('selector type not implemented')
			case Type.STRUCT:
				throw new Error('struct not ready')
			default:
				return exhaust(type)
		}
		let decl: VarDeclaration = {
			type: DeclarationType.VARIABLE,
			varType: type,
			esr
		}
		parameters.push(maybe2.wrap({param:esr,ref:param.ref}))
		maybe.merge(branch.symbols.declareDirect(param.symbol,decl,ctx))
	}
	if (maybe.merge(parseBody(node.body,branch,ctx)))
		return maybe.none()

	if (!branch.getReturnVar()) {
		ctx.addError(node.identifier.error('could not infer function return type'))
		return maybe.none()
	}

	fn.insertEnd(branch.mergeBuffers())

	return maybe.wrap(fndecl)

}