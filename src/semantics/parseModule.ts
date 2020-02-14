
import { CompileContext } from "../toolbox/CompileContext"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { ASTNodeType, ASTStaticBody } from "../syntax/AST"
import { exhaust } from "../toolbox/other"
import { parseFunction } from "./statements/parseFunction"
import { ModDeclaration, DeclarationType } from "./declarations/Declaration"
import { parseDefine } from "./statements/parseDefine"
import { parseStruct } from "./statements/parseStruct"
import { parseEvent } from "./statements/parseEvents"
import { resolveAccess } from "./resolveAccess"
import { parseBody } from "./parseBody"
import { Program } from "./managers/ProgramManager"
import { listDirectives, checkDebugIgnore } from "./directives"

export function parseModule(
	mod: ModDeclaration,
	body: ASTStaticBody,
	ctx: CompileContext,
	program: Program
): Maybe<true> {
	const maybe = new MaybeWrapper<true>()
	
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
				maybe.merge(parseModule(child.value,node.body,ctx,program))
				break
			}
	
			case ASTNodeType.DEFINE: {
				let node0 = node
				maybe.merge(scope.symbols.declareHoister(node.identifier,()=>{
					let res = parseDefine(node0,scope,ctx.logger)
					if (res.value)
						program.fnStore.init.add(res.value.pt)
					return res.pick('decl')
				},ctx.logger))
				break
			}
	
			case ASTNodeType.FUNCTION: {
				let node0 = node
				maybe.merge(scope.symbols.declareHoister(node.identifier,()=>parseFunction(dirs,node0,scope,program.fnStore,ctx.logger,ctx.options),ctx.logger))
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
					const maybe = new MaybeWrapper<true>()

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
					if (!res.value) return maybe.none()
					if (res.value.decl.type != DeclarationType.EVENT) {
						ctx.logger.addError(node0.event.error('expected an event'))
						return maybe.none()
					}
					if (node0.body) {
						let body = parseBody(node0.body,scope.branch('event'),ctx.logger,ctx.options)
						if (!body.value) return maybe.none()
						program.fnStore.appendToEvent(res.value.decl,body.value)
					}
					return maybe.wrap(true)
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

	return maybe.wrap(true)

}
