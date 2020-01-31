import { ASTStatement, ASTNode, ASTNodeType, astArrErr, ASTWhileNode } from "../syntax/AST"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { exhaust } from "../toolbox/other"
import { parseDefine } from "./statements/parseDefine"
import { Logger } from "../toolbox/Logger"
import { parseExpression } from "./expressionParser"
import { Scope } from "./Scope"
import { PTStatement, ptExprToType, PTKind, PTCmdNode, PTBody } from "./ParseTree"
import { isSubType, Type } from "./types/Types"
import { parseWhile } from "./statements/parseWhile"
import { CommentInterspercer } from "../toolbox/CommentInterspercer"

export function parseBody(nodes:ASTStatement[],scope:Scope,log:Logger): Maybe<PTBody> {
	let maybe = new MaybeWrapper<PTBody>()
	let diedAt: ASTNode | null = null

	let body: PTBody = new CommentInterspercer()

	for (let node of nodes) {

		body.addComments(...node.sourceMap())

		switch (node.type) {
			case ASTNodeType.COMMAND: {
				let foundErrors = false
				let interpolations = node.consume.map<PTCmdNode['interpolations'][0]>(n => {
					if (!n.expr) return {node:n.node,capture:n.capture,pt:null}
					let x = parseExpression(n.expr,scope,log)
					if (maybe.merge(x)) {
						foundErrors = true
						return {node:n.node,capture:n.capture,pt:null}
					}
					let type = ptExprToType(x.value)
					if (!isSubType(n.node.getSubstituteType(),type)) {
						log.addError(n.expr.error('type mismatch'))
						maybe.noWrap()
						return {node:n.node,capture:n.capture,pt:null}
					}
					return {node:n.node,capture:n.capture,pt:x.value}
				})
				if (foundErrors) continue
				body.add({
					kind: PTKind.COMMAND,
					interpolations,
					scopeNames: scope.getScopeNames(),
					raw: node.token.value.slice(1)
				})
				break
			}
			case ASTNodeType.SELECTOR:
			case ASTNodeType.PRIMITIVE:
			case ASTNodeType.ACCESS:
			case ASTNodeType.IDENTIFIER:
			case ASTNodeType.INVOKATION:
			case ASTNodeType.OPERATION: {
				let res = parseExpression(node,scope,log)
				if (!maybe.merge(res)) body.add(res.value)
				break
			}
			case ASTNodeType.RETURN: {
				/*let fnscope = scope.getSuperByType('FN')
				if (!fnscope) {
					log.addError(node.error('return must be contained in fn scope'))
					maybe.noWrap()
				}
				let esr: ESR
				if (!node.node) esr = {type:ESRType.VOID,const:false,tmp:false,mutable:false}
				else {
					let x = exprParser(node.node,scope,log,evalOnly())
					if (maybe.merge(x)) continue
					esr = x.value
				}
				if (!fnscope) continue
				let fnret = fnscope.getReturnVar()
				if (!fnret) {
					// do not use copy instr, that is added further down
					let copyRes = copyESR(esr,log,fnscope.nameAppend('return'),{tmp:false,const:false,mutable:false})
					fnscope.setReturnVar(copyRes.esr)
					fnret = copyRes.esr
				}
				
				if (!isSubType(getESRType(esr),getESRType(fnret))) {
					log.addError(node.error('return must match fn return type'))
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
				*/
				console.log('skipped returns')
				break
			}
			case ASTNodeType.CONDITIONAL: {
				let res = parseExpression(node.expression,scope,log)
				if (!maybe.merge(res)) {
					if (ptExprToType(res.value).type != Type.BOOL) {
						log.addError(node.expression.error('not a bool'))
						maybe.noWrap()
					}
				}
				let p = parseBody(node.primaryBranch,scope.branch('if'),log)
				let s = parseBody(node.secondaryBranch,scope.branch('else'),log)
				if (!p.value || !s.value) {
					maybe.noWrap()
					continue
				}
				if (!res.value) continue
				body.add({
					kind: PTKind.CONDITIONAL,
					clause: res.value,
					ifDo: p.value,
					elseDo: s.value,
					scopeNames: scope.getScopeNames()
				})
				break
			}
			case ASTNodeType.DEFINE: {
				let res = parseDefine(node,scope,log)
				if (maybe.merge(res)) continue
				scope.symbols.declareDirect(node.identifier,res.value.decl,log)
				body.add(res.value.pt)
				break
			}

			case ASTNodeType.WHILE: {
				let res = parseWhile(node,scope,log)
				if (maybe.merge(res)) continue
				body.add(res.value)
				break
			}
				
			case ASTNodeType.LIST:
				log.addError(node.error('list not here for now'))
				maybe.noWrap()
				break

			default:
				return exhaust(node)
		}
	}

	if (diedAt) {
		let dead = nodes.slice(nodes.indexOf(diedAt)+1)
		if (dead.length > 0)
			log.addError(astArrErr(dead,'dead code detected',true))
	}

	return maybe.wrap(body)
}
