import { ASTFnNode } from "../../syntax/AST"
import { Scope } from "../Scope"
import { CompileContext } from "../../toolbox/CompileContext"
import { MaybeWrapper, Maybe } from "../../toolbox/Maybe"
import { Declaration, FnDeclaration, DeclarationType, VarDeclaration } from "../Declaration"
import { ESR, ESRType, IntESR, getESRType } from "../ESR"
import { tokenToType, ElementaryValueType } from "../Types"
import { exhaust } from "../../toolbox/other"
import { parseBody } from "../parseBody"

export function parseFunction(node:ASTFnNode,scope:Scope,ctx:CompileContext,thisBinding:ESR|null) {
	const maybe = new MaybeWrapper<Declaration>()

	let parameters: Maybe<{param:ESR,ref:boolean}>[] = []
	let branch = scope.branch(node.identifier.value,'FN',null)
	let fn = ctx.createFnFile(branch.getScopeNames())
	let type = tokenToType(node.returnType,scope.symbols)
	if (!type.elementary) {
		ctx.addError(node.returnType.error('nop thx'))
		return maybe.none()
	}

	let esr: ESR
	switch (type.type) {
		case ElementaryValueType.VOID:
			esr = {type:ESRType.VOID, mutable: false, const: false, tmp: false}
			break
		case ElementaryValueType.INT:
			esr = {type:ESRType.INT, mutable: false, const: false, tmp: false, scoreboard: ctx.scoreboards.getStatic('return',branch)}
			break
		case ElementaryValueType.BOOL:
			esr = {type:ESRType.BOOL, mutable: false, const: false, tmp: false, scoreboard: ctx.scoreboards.getStatic('return',branch)}
			break
		default:
			return exhaust(type.type)
	}
	branch.setReturnVar(esr)

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
		if (!type.elementary) {
			ctx.addError(param.type.error('elementary only thx'))
			parameters.push(maybe2.none())
			continue
		}
		let esr
		switch (type.type) {
			case ElementaryValueType.VOID:
				ctx.addError(param.type.error('not valid'))
				parameters.push(maybe2.none())
				continue
			case ElementaryValueType.INT:
				let iesr: IntESR = {
					type: ESRType.INT,
					scoreboard: ctx.scoreboards.getStatic(param.symbol.value,branch),
					mutable: param.ref, // this controls if function parameters are mutable
					const: false,
					tmp: false
				}
				esr = iesr
				break
			case ElementaryValueType.BOOL:
				ctx.addError(param.type.error('no bool yet thx'))
				parameters.push(maybe2.none())
				continue
			default:
				return exhaust(type.type)
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

	fn.insertEnd(branch.mergeBuffers())

	return maybe.wrap(fndecl)

}