import { ParsingFile } from "../toolbox/ParsingFile"
import { ASTNode, ASTNodeType, ASTOpNode, astErrorMsg, ASTStatement } from "../syntax/AST"
import { ESR, ESRType, getESRType, IntESR, copyESR, assignESR } from "./ESR"
import { tokenToType, ElementaryValueType, ValueType, hasSharedType } from "./Types"
import { DeclarationType, VarDeclaration, FnDeclaration } from "./Declaration"
import { exprParser } from "./expressionParser"
import { exhaust } from "../toolbox/other"
import { CompileContext } from "../toolbox/CompileContext"
import { Scope } from "./Scope"
import { InstrType } from "../codegen/Instructions"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { CompileError } from "../toolbox/CompileErrors"

export function semanticsParser(pfile:ParsingFile,ctx:CompileContext): Maybe<null> {

	const maybe = new MaybeWrapper<null>()
	
	if (pfile.status == 'parsed') return maybe.wrap(null)
	if (pfile.status == 'parsing') throw new Error('circular parsing')

	pfile.status = 'parsing'

	let symbols = pfile.getSymbolTable()
	let scope = pfile.scope
	let ast = pfile.getAST()
	
	tokenLoop:
	for (let node of ast) {
		let shouldExport = false

		if (node.type == ASTNodeType.EXPORT) {
			node = node.node
			shouldExport = true
		}

		while (node.type == ASTNodeType.EXPORT) {
			ctx.addError(node.keyword.error('Unexpected keyword'))
			node = node.node
			maybe.noWrap()
		}

		switch (node.type) {

			case ASTNodeType.MODULE:
				throw new Error('wait modules oka')

			case ASTNodeType.DEFINE: {
				let type = tokenToType(node.varType,symbols)
				if (type.elementary && type.type == ElementaryValueType.VOID) {
					ctx.addError(node.varType.error(`Cannot declare a variable of type 'void'`))
					continue
				}
				if (!type.elementary) node.varType.throwDebug('no non-elemn rn k')
				let esr0 = exprParser(node.initial,scope,ctx)
				if (maybe.merge(esr0)) continue
				let res = copyESR(esr0.value,ctx,scope,node.identifier.value,{tmp:false,mutable:true,const:false})
				let esr = res.esr
				// do something with res.copyInstr
				
				if (!hasSharedType(getESRType(esr),type)) {
					ctx.addError(node.identifier.error('type mismatch'))
					continue
				}
				let decl: VarDeclaration = {type:DeclarationType.VARIABLE,varType:type,esr}
				let declWrap = {decl,token:node.identifier}
				symbols.declare(declWrap)
				if (shouldExport) pfile.addExport(declWrap)
				break
			}
	
			case ASTNodeType.FUNCTION: {
				let parameters: Maybe<{param:ESR,ref:boolean}>[] = []
				let branch = scope.branch(node.identifier.value,'FN',null)
				let fn = ctx.createFnFile(branch.getScopeNames())
				let type = tokenToType(node.returnType,symbols)
				if (!type.elementary) {
					ctx.addError(node.returnType.error('nop thx'))
					continue
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
				let decl: FnDeclaration = {
					type: DeclarationType.FUNCTION,
					esr: esr,
					fn,
					parameters
				}
				symbols.declare({token:node.identifier,decl})
				for (let param of node.parameters) {
					let type = tokenToType(param.type,symbols)
					if (!type.elementary) {
						ctx.addError(param.type.error('elementary only thx'))
						parameters.push(MaybeWrapper.direct())
						continue
					}
					let esr
					switch (type.type) {
						case ElementaryValueType.VOID:
							ctx.addError(param.type.error('not valid'))
							parameters.push(MaybeWrapper.direct())
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
						case ElementaryValueType.BOOL: {}
							ctx.addError(param.type.error('no bool yet thx'))
							parameters.push(MaybeWrapper.direct())
							continue
						default:
							return exhaust(type.type)
					}
					let decl: VarDeclaration = {
						type: DeclarationType.VARIABLE,
						varType: type,
						esr
					}
					parameters.push(MaybeWrapper.direct({param:esr,ref:param.ref}))
					branch.symbols.declare({token:param.symbol,decl})
				}
				if (shouldExport) pfile.addExport({token:node.identifier,decl})
				if (maybe.merge(parseBody(node.body,branch,ctx))) continue

				fn.add(...branch.mergeBuffers())
				
				break
			}

			default:
				return exhaust(node)
	
		}

	}

	// Check unused
	for (let [key,decl] of Object.entries(symbols.getUnreferenced())) {
		if (!pfile.hasExport(key)) ctx.addError(decl.token.warning('Unused'))
	}

	pfile.status = 'parsed'

	return maybe.wrap(null)

}

function parseBody(nodes:ASTStatement[],scope:Scope,ctx:CompileContext): Maybe<null> {
	let maybe = new MaybeWrapper<null>()
	let diedAt: ASTNode | null = null
	for (let node of nodes) {

		switch (node.type) {
			case ASTNodeType.COMMAND: {
				let foundErrors = false
				let interpolations = node.interpolations.flatMap(n => {
					let x = exprParser(n,scope,ctx)
					if (maybe.merge(x)) {
						foundErrors = true
						return []
					}
					return [x.value]
				})
				if (foundErrors) continue
				if (!diedAt)
					scope.push({
						type:InstrType.CMD,
						interpolations
					})
				break
			}
			case ASTNodeType.INVOKATION:
			case ASTNodeType.OPERATION: {
				maybe.merge(exprParser(node,scope,ctx))
				break
			}
			case ASTNodeType.RETURN: {
				let fnscope = scope.getSuperByType('FN')
				if (!fnscope) throw new Error('ast throw would be nice... return must be contained in fn scope')
				let fnret = fnscope.getReturnVar()
				if (!fnret) throw new Error('fn scope does not have return var')
				let esr: ESR
				if (!node.node) esr = {type:ESRType.VOID,const:false,tmp:false,mutable:false}
				else {
					let x = exprParser(node.node,scope,ctx)
					if (maybe.merge(x)) continue
					esr = x.value
				}
				
				if (!hasSharedType(getESRType(esr),getESRType(fnret))) {
					ctx.addError(new CompileError(astErrorMsg(node,'return must match fn return type'),false))
					maybe.noWrap()
					continue
				}

				// return instructions
				if (!diedAt) {
					if (esr.type != ESRType.VOID)
						scope.push(...assignESR(esr,fnret))
					scope.breakScopes(fnscope)
					diedAt = node
				}

				break
			}
			case ASTNodeType.NUMBER:
			case ASTNodeType.STRING:
			case ASTNodeType.BOOLEAN:
			case ASTNodeType.IDENTIFIER:
				throw new Error('valid, but pointless')
			case ASTNodeType.CONDITIONAL: {
				let esr = exprParser(node.expression,scope,ctx)
				if (maybe.merge(esr)) continue
				if (esr.value.type != ESRType.BOOL) throw new Error('if not bool esr')
				/*parseBody(node.primaryBranch,scope.branch('if','NONE',{
					type:ESRType.VOID, mutable: false, const: false, tmp: false
				}),ctx)
				parseBody(node.secondaryBranch,scope.branch('if','NONE',{
					type:ESRType.VOID, mutable: false, const: false, tmp: false
				}),ctx)*/
				break
			}
			case ASTNodeType.DEFINE: {
				let type = tokenToType(node.varType,scope.symbols)
				if (type.elementary && type.type == ElementaryValueType.VOID)
					node.varType.throwDebug(`Cannot declare a variable of type 'void'`)
				if (!type.elementary) node.varType.throwDebug('no non-elemn rn k')
				let esr0 = exprParser(node.initial,scope,ctx)
				if (maybe.merge(esr0)) continue
				let res = copyESR(esr0.value,ctx,scope,node.identifier.value,{tmp:false,mutable:true,const:false})
				let esr = res.esr
				if (!diedAt)
					scope.push(res.copyInstr)

				if (!hasSharedType(getESRType(esr),type)) node.identifier.throwDebug('type mismatch')
				let decl: VarDeclaration = {type:DeclarationType.VARIABLE,varType:type,esr}
				if (!diedAt)
					scope.symbols.declare({token:node.identifier,decl})
				break
			}
			case ASTNodeType.LIST:
				ctx.addError(new CompileError(astErrorMsg(node,'list not here for now'),false))
				maybe.noWrap()
				break

			case ASTNodeType.REFERENCE:
				ctx.addError(node.keyword.error('unexpected keyword'))
				maybe.noWrap()
				break

			default:
				return exhaust(node)
		}
	}

	if (diedAt) {
		let dead = nodes.slice(nodes.indexOf(diedAt)+1)
		if (dead.length > 0)
			ctx.addError(new CompileError(
				astErrorMsg(
					dead,
					'Dead code detected'
				),
				true
			))
	}

	return maybe.wrap(null)
}
