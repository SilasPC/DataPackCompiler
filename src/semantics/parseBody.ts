import { ASTStatement, ASTNode, ASTNodeType, astErrorMsg, astWarning } from "../syntax/AST"
import { Scope } from "./Scope"
import { CompileContext } from "../toolbox/CompileContext"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { exprParser } from "./expressionParser"
import { InstrType } from "../codegen/Instructions"
import { ESR, ESRType, getESRType, assignESR, copyESR } from "./ESR"
import { hasSharedType, tokenToType, ElementaryValueType } from "./Types"
import { CompileError } from "../toolbox/CompileErrors"
import { VarDeclaration, DeclarationType } from "./Declaration"
import { exhaust } from "../toolbox/other"
import { parseDefine } from "./statements/parseDefine"

export function parseBody(nodes:ASTStatement[],scope:Scope,ctx:CompileContext): Maybe<true> {
	let maybe = new MaybeWrapper<true>()
	let diedAt: ASTNode | null = null

	const evalOnly = () => ctx.options.optimize ? diedAt != null : false

	for (let node of nodes) {

		switch (node.type) {
			case ASTNodeType.COMMAND: {
				let foundErrors = false
				let interpolations = node.consume.map(n => {
					if (!n.expr) return {node:n.node,capture:n.capture,esr:null}
					let x = exprParser(n.expr,scope,ctx,evalOnly())
					if (maybe.merge(x)) {
						foundErrors = true
						return {node:n.node,capture:n.capture,esr:null}
					}
					return {node:n.node,capture:n.capture,esr:x.value}
				})
				if (foundErrors) continue
				if (!evalOnly())
					scope.push({
						type:InstrType.CMD,
						cmd: node.token.value.slice(1),
						interpolations
					})
				break
			}
			case ASTNodeType.INVOKATION:
			case ASTNodeType.OPERATION: {
				maybe.merge(exprParser(node,scope,ctx,evalOnly()))
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
					let x = exprParser(node.node,scope,ctx,evalOnly())
					if (maybe.merge(x)) continue
					esr = x.value
				}
				
				if (!hasSharedType(getESRType(esr),getESRType(fnret))) {
					ctx.addError(new CompileError(astErrorMsg(node,'return must match fn return type'),false))
					maybe.noWrap()
					continue
				}

				// return instructions
				if (!evalOnly()) {
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
			case ASTNodeType.STATIC_ACCESS:
			case ASTNodeType.IDENTIFIER:
				ctx.addError(astWarning(node,'unused expression'))
				exprParser(node,scope,ctx,evalOnly())
				break
			case ASTNodeType.CONDITIONAL: {
				let esr = exprParser(node.expression,scope,ctx,evalOnly())
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
				let res = parseDefine(node,scope,ctx)
				maybe.merge(res)
				if (res.value) {
					scope.symbols.declareDirect(node.identifier,res.value.decl,ctx)
					scope.push(res.value.copyInstr)
				}
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

	for (let [,decl] of scope.symbols.getUnreferenced()) {
		ctx.addError(decl.token.warning('Unused local'))
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

	return maybe.wrap(true)
}
