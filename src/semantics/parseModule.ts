
import { CompileContext } from "../toolbox/CompileContext"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { ASTNodeType, ASTStaticDeclaration } from "../syntax/AST"
import { exhaust } from "../toolbox/other"
import { parseFunction } from "./statements/parseFunction"
import { ModDeclaration, DeclarationType } from "./declarations/Declaration"
import { parseDefine } from "./statements/parseDefine"
import { parseStruct } from "./statements/parseStruct"
import { Scope } from "./Scope"
import { parseEvent } from "./statements/parseEvents"
import { resolveAccess } from "./resolveAccess"
import { parseBody } from "./parseBody"
import { Program } from "./managers/ProgramManager"

export function parseModule(
	mod: ModDeclaration,
	body: readonly ASTStaticDeclaration[],
	ctx: CompileContext,
	program: Program
): Maybe<true> {
	const maybe = new MaybeWrapper<true>()
	
	const scope = mod.scope

	for (let node of body) {

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
				let child = mod.branch(node.identifier,ctx.logger)
				if (maybe.merge(child)) break
				maybe.merge(parseModule(child.value,node.body,ctx,program))
				break
			}
	
			case ASTNodeType.DEFINE: {
				let node0 = node
				maybe.merge(scope.symbols.declareHoister(node.identifier,()=>{
					let res = parseDefine(node0,scope,ctx.logger)
					if (res.value)
						program.parseTree.init.add(res.value.pt)
					return res.pick('decl')
				},ctx.logger))
				break
			}
	
			case ASTNodeType.FUNCTION: {
				let node0 = node
				maybe.merge(scope.symbols.declareHoister(node.identifier,()=>parseFunction(node0,scope,program.parseTree,ctx.logger),ctx.logger))
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
				scope.symbols.declareHoister(node.identifier,()=>parseEvent(node0,scope,ctx.logger,program),ctx.logger)
				break
			}

			case ASTNodeType.ON: {
				let node0 = node
				program.defer(() => {
					const maybe = new MaybeWrapper<true>()
					let res = resolveAccess(node0.event,scope,ctx.logger)
					if (!res.value) return maybe.none()
					if (res.value.decl.type != DeclarationType.EVENT) {
						ctx.logger.addError(node0.event.error('expected an event'))
						return maybe.none()
					}
					if (node0.body) {
						let body = parseBody(node0.body,scope.branch('event'),ctx.logger)
						if (!body.value) return maybe.none()
						program.parseTree.appendToEvent(res.value.decl,body.value)
					}
					return maybe.wrap(true)
				})
				break
			}
				
			default:
				return exhaust(node)
	
		}

	}

	return maybe.wrap(true)

}
