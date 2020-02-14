import { ASTStatement, ASTNode, ASTNodeType, astArrErr, ASTWhileNode, ASTBody } from "../syntax/AST"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { exhaust, checkDebugIgnore } from "../toolbox/other"
import { parseDefine } from "./statements/parseDefine"
import { Logger } from "../toolbox/Logger"
import { parseExpression } from "./expressionParser"
import { Scope } from "./Scope"
import { PTStatement, ptExprToType, PTKind, PTCmdNode, PTBody, PTReturn } from "./ParseTree"
import { isSubType, Type, ValueType } from "./types/Types"
import { parseWhile } from "./statements/parseWhile"
import { CompilerOptions } from "../toolbox/config"
import { Interspercer } from "../toolbox/Interspercer"

export function parseBody(nodes:ASTBody,scope:Scope,log:Logger,cfg:CompilerOptions): Maybe<PTBody> {
	let maybe = new MaybeWrapper<PTBody>()

	let returnedAt: ASTNode | null = null

	let body: PTBody = new Interspercer()

	for (let [dirs,node] of nodes.iterate()) {

		if (checkDebugIgnore(dirs,cfg.debugBuild)) continue

		for (let dir of dirs) {
			let val = dir.value.slice(2,-1).trim()
			switch (val) {
				case 'debug':
					break
				default:
					log.addError(dir.error('unknown directive'))
					maybe.noWrap()
			}
			
		}

		if (cfg.sourceMap && !returnedAt) body.addSubData(...node.sourceMap())

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
				if (!maybe.merge(res)) {
					if (!returnedAt) body.add(res.value)
				}
				break
			}
			case ASTNodeType.RETURN: {
				let fnscope = scope.lastFnScope()
				let ret = node.node ? parseExpression(node.node,scope,log) : null
				if (!fnscope) {
					log.addError(node.error('return must be contained in fn scope'))
					maybe.noWrap()
					break
				} else {
					if (!returnedAt) returnedAt = node
				}
				if (ret&&!ret.value) {
					maybe.noWrap()
					break
				}
				let pt: PTReturn
				if (ret) {
					pt = {
						kind: PTKind.RETURN,
						expr: ret.value,
						fn: fnscope.declaration,
						type: ptExprToType(ret.value)
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
					maybe.noWrap()
					break
				}

				if (!returnedAt) body.add(pt)
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
				let p = parseBody(node.primaryBranch,scope.branch('if'),log,cfg)
				let s = parseBody(node.secondaryBranch,scope.branch('else'),log,cfg)
				if (!p.value || !s.value) {
					maybe.noWrap()
					continue
				}
				if (!res.value) continue
				if (!returnedAt) body.add({
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
				if (maybe.merge(res)) {
					scope.symbols.declareInvalidDirect(node.identifier,log)
					continue
				}
				maybe.merge(scope.symbols.declareDirect(node.identifier,res.value.decl,log))
				if (!returnedAt) body.add(res.value.pt)
				break
			}

			case ASTNodeType.WHILE: {
				let res = parseWhile(node,scope,log,cfg)
				if (maybe.merge(res)) continue
				if (!returnedAt) body.add(res.value)
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

	if (returnedAt) {
		let dead = nodes.getData().slice(nodes.getData().indexOf(returnedAt)+1)
		if (dead.length > 0)
			log.addWarning(astArrErr(dead,'dead code detected'))
	}

	return maybe.wrap(body)
}
