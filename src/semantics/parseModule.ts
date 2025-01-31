
import { CompileContext } from "../toolbox/CompileContext"
import { ASTNodeType, ASTStaticBody } from "../syntax/AST"
import { exhaust } from "../toolbox/other"
import { parseFunction } from "./statements/parseFunction"
import { ModDeclaration, DeclarationType, Declaration } from "./declarations/Declaration"
import { parseDefine } from "./statements/parseDefine"
import { parseStruct } from "./statements/parseStruct"
import { parseEvent } from "./statements/parseEvents"
import { resolveAccess, resolveStatic } from "./resolveAccess"
import { parseBody } from "./parseBody"
import { Program } from "./managers/ProgramManager"
import { listDirectives, checkDebugIgnore } from "./directives"
import { EmptyResult, ResultWrapper } from "../toolbox/Result"

export function parseModule(
	mod: ModDeclaration,
	body: ASTStaticBody,
	ctx: CompileContext,
	program: Program
): EmptyResult {
	const result = new ResultWrapper()
	
	const scope = mod.scope

	for (let [dirTokens,node] of body.iterate()) {

		let dirs = listDirectives(dirTokens)
		if (checkDebugIgnore(dirs.getEnsured(),ctx.options.debugBuild)) continue

		let isPublic = false

		if (node.type == ASTNodeType.PUBLIC) {
			node = node.node
			isPublic = true
		}

		switch (node.type) {

			case ASTNodeType.USE: {
				let node0 = node
				let name = node.identifier.accessors[node.identifier.accessors.length-1]
				result.mergeCheck(scope.symbols.declareHoister(name,()=>resolveStatic(node0.identifier.accessors,scope.symbols)))
				break
			}
	
			case ASTNodeType.MODULE: {
				let node0 = node
				result.mergeCheck(scope.symbols.declareHoister(node.identifier,()=>{
					const result = new ResultWrapper<Declaration,null>()
					let child = mod.branch(node0.identifier,program)
					if (result.merge(child)) return result.none()
					result.mergeCheck(parseModule(child.getValue(),node0.body,ctx,program))
					return result.pass(child)
				}))
				break
			}
	
			case ASTNodeType.DEFINE: {
				let node0 = node
				result.mergeCheck(scope.symbols.declareHoister(node.identifier,()=>{
					const result = new ResultWrapper<Declaration,null>()
					let res = parseDefine(node0,scope)
					if (result.merge(res)) return result.none()
					program.fnStore.init.add(res.getValue().pt)
					return result.wrap(res.getValue().decl)
				}))
				break
			}
	
			case ASTNodeType.FUNCTION: {
				let node0 = node
				result.mergeCheck(scope.symbols.declareHoister(node.identifier,()=>parseFunction(dirs.getEnsured(),node0,scope,program.fnStore,ctx.options)))
				break
			}
	
			case ASTNodeType.RECIPE:
				console.log('wait recipe')
				break
	
			case ASTNodeType.STRUCT: {
				let node0 = node
				result.mergeCheck(scope.symbols.declareHoister(node.identifier,()=>parseStruct(node0,scope)))
				break
			}

			case ASTNodeType.EVENT: {
				let node0 = node
				result.mergeCheck(scope.symbols.deferHoister(node.identifier,()=>parseEvent(dirs.getEnsured(),node0,scope,program,ctx.options)))
				break
			}

			case ASTNodeType.ON: {
				let node0 = node
				program.hoisting.defer(() => {
					const result = new ResultWrapper()

					/*for (let dir of dirs) {
						let val = dir.value.slice(2,-1).trim()
						switch (val) {
							case 'debug':
								break
							case 'tick':
							case 'load':
							case 'inline':
								ctx.logger.addError(dir.error('not available for event binding'))
								maybe.noWrap()
								break
							case 'todo':
								ctx.logger.addWarning(dir.error('event binding not fully implemented'))
								break
							default:
								ctx.logger.addError(dir.error('unknown directive'))
								maybe.noWrap()
								break
						}
					}*/

					let res = resolveAccess(node0.event,scope)
					if (result.merge(res)) return result.empty()
					let decl = res.getValue()
					if (decl.type != DeclarationType.EVENT) {
						result.addError(node0.event.error('expected an event'))
						return result.empty()
					}
					if (node0.body) {
						let body = parseBody(node0.body,scope.branch('event'),ctx.options)
						if (result.merge(body)) return result.empty()
						program.fnStore.appendToEvent(decl,body.getValue())
					}
					return result.empty()
				})
				break
			}
				
			default:
				return exhaust(node)
	
		}

	}

	const trailingDirective = body.getTrailingSubData()
	if (trailingDirective.length)
		result.addWarning(trailingDirective[0].error('trailing directive(s)'))

	return result.empty()

}
