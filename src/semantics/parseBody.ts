import { ASTNode, ASTNodeType, astArrErr, ASTBody } from "../syntax/AST"
import { exhaust } from "../toolbox/other"
import { parseDefine } from "./statements/parseDefine"
import { Logger } from "../toolbox/Logger"
import { parseExpression } from "./expressionParser"
import { Scope } from "./Scope"
import { ptExprToType, PTKind, PTCmdNode, PTBody, PTReturn } from "./ParseTree"
import { isSubType, Type } from "./types/Types"
import { parseWhile } from "./statements/parseWhile"
import { CompilerOptions } from "../toolbox/config"
import { Interspercer } from "../toolbox/Interspercer"
import { listDirectives, checkDebugIgnore } from "./directives"
import { Result, ResultWrapper } from "../toolbox/Result"

export function parseBody(nodes:ASTBody,scope:Scope,log:Logger,cfg:CompilerOptions): Result<PTBody,null> {
	let result = new ResultWrapper<PTBody,null>()

	let returnedAt: ASTNode | null = null

	let body: PTBody = new Interspercer()

	for (let [dirTokens,node] of nodes.iterate()) {
		
		let dirs = listDirectives(dirTokens,log)
		if (checkDebugIgnore(dirs,cfg.debugBuild)) continue

		/*for (let dir of dirs) {
			let val = dir.value.slice(2,-1).trim()
			switch (val) {
				case 'debug':
					break
				default:
					log.addError(dir.error('unknown directive'))
					maybe.noWrap()
			}
			
		}*/

		if (cfg.sourceMap && !returnedAt) body.addSubData(...node.sourceMap())

		switch (node.type) {
			case ASTNodeType.COMMAND: {

				let foundErrors = false
				let interpolations = node.consume.map<PTCmdNode['interpolations'][0]>(n => {
					if (!n.expr) return {node:n.node,capture:n.capture,pt:null}
					let x = parseExpression(n.expr,scope,log)
					if (result.merge(x)) {
						foundErrors = true
						return {node:n.node,capture:n.capture,pt:null}
					}
					let type = ptExprToType(x.getValue())
					if (!isSubType(n.node.getSubstituteType(),type)) {
						log.addError(n.expr.error('type mismatch'))
						return {node:n.node,capture:n.capture,pt:null}
					}
					return {node:n.node,capture:n.capture,pt:x.getValue()}
				})

				if (foundErrors) continue
				
				if (!returnedAt) body.add({
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
				if (!result.merge(res)) {
					if (!returnedAt) body.add(res.getValue())
				}
				break
			}
			case ASTNodeType.RETURN: {
				let fnscope = scope.lastFnScope()
				let ret = node.node ? parseExpression(node.node,scope,log) : null
				if (!fnscope) {
					log.addError(node.error('return must be contained in fn scope'))
					break
				} else {
					if (!returnedAt) returnedAt = node
				}
				if (ret&&result.merge(ret)) {
					break
				}
				let pt: PTReturn
				if (ret) {
					pt = {
						kind: PTKind.RETURN,
						expr: ret.getValue(),
						fn: fnscope.declaration,
						type: ptExprToType(ret.getValue())
					}
				} else {
					pt = {
						kind: PTKind.RETURN,
						expr: null,
						fn: fnscope.declaration,
						type: {type:Type.VOID}
					}
				}

				if (!isSubType(fnscope.declaration.returns,pt.type)) {
					log.addError(node.error('return must match fn return type'))
					break
				}

				if (!returnedAt) body.add(pt)
				break
			}
			case ASTNodeType.CONDITIONAL: {
				let res = parseExpression(node.expression,scope,log)
				let p = parseBody(node.primaryBranch,scope.branch('if'),log,cfg)
				let s = parseBody(node.secondaryBranch,scope.branch('else'),log,cfg)
				if (result.merge(res) || result.merge(p) || result.merge(s)) continue
				if (ptExprToType(res.getValue()).type != Type.BOOL) {
					log.addError(node.expression.error('not a bool'))
				}
				if (!res.getValue()) continue
				if (!returnedAt) body.add({
					kind: PTKind.CONDITIONAL,
					clause: res.getValue(),
					ifDo: p.getValue(),
					elseDo: s.getValue(),
					scopeNames: scope.getScopeNames()
				})
				break
			}
			case ASTNodeType.DEFINE: {
				let res = parseDefine(node,scope,log)
				if (result.merge(res)) {
					scope.symbols.declareInvalidDirect(node.identifier,log)
					continue
				}
				result.mergeCheck(scope.symbols.declareDirect(node.identifier,res.getValue().decl,log))
				if (!returnedAt) body.add(res.getValue().pt)
				break
			}

			case ASTNodeType.WHILE: {
				let res = parseWhile(node,scope,log,cfg)
				if (result.merge(res)) continue
				if (!returnedAt) body.add(res.getValue())
				break
			}
				
			case ASTNodeType.LIST:
				log.addError(node.error('list not here for now'))
				break

			default:
				return exhaust(node)
		}
	}

	if (returnedAt) {
		let dead = nodes.getData().slice(nodes.getData().indexOf(returnedAt)+1)
		if (dead.length > 0)
			log.addWarning(astArrErr(dead,'dead code detected'))
	}

	return result.wrap(body)
}
