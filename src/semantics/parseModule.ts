
import { CompileContext } from "../toolbox/CompileContext"
import { ASTNodeType, ASTStaticBody } from "../syntax/AST"
import { exhaust } from "../toolbox/other"
import { parseFunction } from "./statements/parseFunction"
import { ModDeclaration, DeclarationType, Declaration } from "./declarations/Declaration"
import { parseDefine } from "./statements/parseDefine"
import { parseStruct } from "./statements/parseStruct"
import { parseEvent } from "./statements/parseEvents"
import { resolveAccess } from "./resolveAccess"
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
	const maybe = new ResultWrapper()
	
	const scope = mod.scope

	for (let [dirTokens,node] of body.iterate()) {

		let dirs = listDirectives(dirTokens,ctx.logger)
		if (checkDebugIgnore(dirs,ctx.options.debugBuild)) continue

		let isPublic = false

		if (node.type == ASTNodeType.PUBLIC) {
			node = node.node
			isPublic = true
		}

		switch (node.type) {

			case ASTNodeType.USE: {
				let node0 = node
				scope.symbols.declareHoister(node.accessors[node.accessors.length-1],()=>mod.fetchModule(node0.accessors,ctx.logger),ctx.logger)
				break
			}
	
			case ASTNodeType.MODULE: {
				let child = mod.branch(node.identifier,ctx.logger,program)
				if (maybe.merge(child)) break
				maybe.mergeCheck(parseModule(child.getValue(),node.body,ctx,program))
				break
			}
	
			case ASTNodeType.DEFINE: {
				let node0 = node
				maybe.mergeCheck(scope.symbols.declareHoister(node.identifier,()=>{
					const result = new ResultWrapper<Declaration,null>()
					let res = parseDefine(node0,scope,ctx.logger)
					if (result.merge(res)) return result.none()
					program.fnStore.init.add(res.getValue().pt)
					return result.wrap(res.getValue().decl)
				},ctx.logger))
				break
			}
	
			case ASTNodeType.FUNCTION: {
				let node0 = node
				maybe.mergeCheck(scope.symbols.declareHoister(node.identifier,()=>parseFunction(dirs,node0,scope,program.fnStore,ctx.logger,ctx.options),ctx.logger))
				break
			}
	
			case ASTNodeType.RECIPE:
				console.log('wait recipe')
				break
	
			case ASTNodeType.STRUCT: {
				let node0 = node
				scope.symbols.declareHoister(node.identifier,()=>parseStruct(node0,scope,ctx),ctx.logger)
				break
			}

			case ASTNodeType.EVENT: {
				let node0 = node
				scope.symbols.declareHoister(node.identifier,()=>parseEvent(dirs,node0,scope,ctx.logger,program),ctx.logger)
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

					let res = resolveAccess(node0.event,scope,ctx.logger)
					if (result.merge(res)) return result.empty()
					let {decl} = res.getValue()
					if (decl.type != DeclarationType.EVENT) {
						ctx.logger.addError(node0.event.error('expected an event'))
						return result.empty()
					}
					if (node0.body) {
						let body = parseBody(node0.body,scope.branch('event'),ctx.logger,ctx.options)
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
		ctx.logger.addWarning(trailingDirective[0].error('trailing directive(s)'))

	return maybe.empty()

}
