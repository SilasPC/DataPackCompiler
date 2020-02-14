import { ASTEventNode } from "../../syntax/AST"
import { Scope } from "../Scope"
import { Logger } from "../../toolbox/Logger"
import { Maybe, MaybeWrapper } from "../../toolbox/Maybe"
import { EventDeclaration, DeclarationType } from "../declarations/Declaration"
import { Program } from "../managers/ProgramManager"
import { Interspercer } from "../../toolbox/Interspercer"
import { DirectiveToken } from "../../lexing/Token"
import { DirectiveList } from "../directives"
import { exhaust } from "../../toolbox/other"

export function parseEvent(dirs: DirectiveList, node: ASTEventNode, scope:Scope, log:Logger, program: Program): Maybe<EventDeclaration> {
	const maybe = new MaybeWrapper<EventDeclaration>()

	let decl: EventDeclaration = {
        type: DeclarationType.EVENT,
        namePath: scope.nameAppend(node.identifier.value)
	}

	for (let {value, token} of dirs) {
		switch (value) {
			case 'debug': break
			case 'tick':
				program.setEventToTick(decl)
				break
			case 'load':
				program.setEventToLoad(decl)
				break
			case 'todo':
				log.addWarning(token.error('event not fully implemented'))
				break
			case 'inline':
				log.addError(token.error('not available for events'))
				maybe.noWrap()
				break
			default: return exhaust(value)
		}
	}

	program.fnStore.appendToEvent(decl,new Interspercer())

	return maybe.wrap(decl)
	
}