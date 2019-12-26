import { ParsingFile } from "../lexing/ParsingFile"
import { ASTNode, ASTNodeType, ASTOpNode } from "../syntax/AST"
import { ESR, ESRType, getESRType, IntESR, copyESRToLocal, assignESR } from "./ESR"
import { tokenToType, ElementaryValueType, ValueType, hasSharedType } from "./Types"
import { DeclarationType, VarDeclaration, FnDeclaration, ImplicitVarDeclaration } from "./Declaration"
import { exprParser } from "./expressionParser"
import { exhaust } from "../toolbox/other"
import { CompileContext } from "../toolbox/CompileContext"
import { Scope } from "./Scope"
import { InstrType } from "../codegen/Instructions"

export function semanticsParser(pfile:ParsingFile,ctx:CompileContext): void {
	
	if (pfile.status == 'parsed') return
	if (pfile.status == 'parsing') throw new Error('circular parsing')

	pfile.status = 'parsing'

	let symbols = pfile.getSymbolTable()
	let scope = pfile.scope
	let ast = pfile.getAST()

	for (let node of ast) {
		let shouldExport = false

		if (node.type == ASTNodeType.EXPORT) node = node.node

		switch (node.type) {

			case ASTNodeType.DEFINE: {
					let type = tokenToType(node.varType,symbols)
					if (type.elementary && type.type == ElementaryValueType.VOID)
						node.varType.throwDebug(`Cannot declare a variable of type 'void'`)
					if (!type.elementary) node.varType.throwDebug('no non-elemn rn k')
					let esr = exprParser(node.initial,scope,ctx)
					// the above cannot be used for the variables esr
					// we must create a new esr, then assign the above to that
					// file-level declarations are assigned during init, so
					// we must add the assignations instruction to datapack init
					let res = copyESRToLocal(esr,ctx,scope,node.identifier.value)
					esr = res.esr
					// do something with res.copyInstr
					
					if (!hasSharedType(getESRType(esr),type)) node.identifier.throwDebug('type mismatch')
					let decl: VarDeclaration = {type:DeclarationType.VARIABLE,varType:type,node,esr}
					symbols.declare(node.identifier,decl)
					if (shouldExport) pfile.addExport(node.identifier.value,decl)
					break
				}
	
			case ASTNodeType.FUNCTION: {
				let parameters: ESR[] = []
				let branch = scope.branch(node.identifier.value,'FN',null)
				let fn = ctx.createFnFile(branch.getScopeNames())
				let type = tokenToType(node.returnType,symbols)
				if (!type.elementary) return node.returnType.throwDebug('nop thx')
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
				let decl: FnDeclaration = {
					type: DeclarationType.FUNCTION,
					returns: esr,
					node,
					fn,
					parameters
				}
				symbols.declare(node.identifier,decl)
				for (let param of node.parameters) {
					let type = tokenToType(param.type,symbols)
					if (!type.elementary) return param.type.throwDebug('elementary only thx')
					let esr
					switch (type.type) {
						case ElementaryValueType.VOID:
							return param.type.throwDebug('not valid')
						case ElementaryValueType.INT:
							let iesr: IntESR = {
								type: ESRType.INT,
								scoreboard: ctx.scoreboards.getStatic(param.symbol.value,branch),
								mutable: false, // this controls if function parameters are mutable
								const: false,
								tmp: false
							}
							esr = iesr
							break
						case ElementaryValueType.BOOL:
							return param.type.throwDebug('no bool yet thx')
						default:
							return exhaust(type.type)
					}
					let decl: ImplicitVarDeclaration = {
						type: DeclarationType.IMPLICIT_VARIABLE,
						varType: type,
						esr
					}
					parameters.push(esr)
					branch.symbols.declare(param.symbol,decl)
				}
				if (shouldExport) pfile.addExport(node.identifier.value,decl)
				parseBody(node.body,branch,ctx)

				fn.add(...branch.mergeBuffers())

				// test anti alias optimization
				//test(decl.fn)
				/*console.log(node.identifier.value)
				console.log(generateTest(decl,ctx))*/
				
				break
			}

			case ASTNodeType.RETURN:
			case ASTNodeType.IDENTIFIER:
			case ASTNodeType.INVOKATION:
			case ASTNodeType.OPERATION:
			case ASTNodeType.BOOLEAN:
			case ASTNodeType.NUMBER:
			case ASTNodeType.STRING:
			case ASTNodeType.EXPORT:
			case ASTNodeType.COMMAND:
			case ASTNodeType.CONDITIONAL:
			case ASTNodeType.LIST:
					throw new Error('wth man, ast invalid at file root')

			default:
				return exhaust(node)
	
		}

	}

	pfile.status = 'parsed'

}

function parseBody(nodes:ASTNode[],scope:Scope,ctx:CompileContext): void {
	for (let node of nodes) {
		switch (node.type) {
			case ASTNodeType.COMMAND:
				scope.push({
					type:InstrType.CMD,
					interpolations: node.interpolations.map(n=>exprParser(n,scope,ctx))
				})
				break
			case ASTNodeType.INVOKATION:
			case ASTNodeType.OPERATION:
				exprParser(node,scope,ctx)
				break
			case ASTNodeType.RETURN:
				let fnscope = scope.getSuperByType('FN')
				if (!fnscope) throw new Error('ast throw would be nice... return must be contained in fn scope')
				let fnret = fnscope.getReturnVar()
				if (!fnret) throw new Error('fn scope does not have return var')
				let esr: ESR
				if (!node.node) esr = {type:ESRType.VOID,const:false,tmp:false,mutable:false}
				else esr = exprParser(node.node,scope,ctx)
				
				if (!hasSharedType(getESRType(esr),getESRType(fnret)))
					throw new Error('ast throw would be nice... return must match fn return type')

				// return instructions
				if (esr.type != ESRType.VOID)
					scope.push(...assignESR(esr,fnret))
				scope.push(...scope.breakScopes(fnscope))
				
				break
			case ASTNodeType.NUMBER:
			case ASTNodeType.STRING:
			case ASTNodeType.BOOLEAN:
			case ASTNodeType.IDENTIFIER:
				throw new Error('valid, but pointless')
			case ASTNodeType.CONDITIONAL:
			case ASTNodeType.DEFINE:
				throw new Error('not implemented')
			case ASTNodeType.LIST:
			case ASTNodeType.FUNCTION:
			case ASTNodeType.EXPORT:
				throw new Error('invalid ast structure')
			default:
				return exhaust(node)
		}
	}
}
