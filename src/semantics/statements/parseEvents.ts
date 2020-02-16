import { ASTEventNode } from "../../syntax/AST"
import { Scope } from "../Scope"
import { Logger } from "../../toolbox/Logger"
import { EventDeclaration, DeclarationType } from "../declarations/Declaration"
import { Program } from "../managers/ProgramManager"
import { Interspercer } from "../../toolbox/Interspercer"
import { DirectiveToken } from "../../lexing/Token"
import { DirectiveList } from "../directives"
import { exhaust } from "../../toolbox/other"
import { Result, ResultWrapper } from "../../toolbox/Result"

export function parseEvent(dirs: DirectiveList, node: ASTEventNode, scope:Scope, program: Program): Result<EventDeclaration,null> {
	const result = new ResultWrapper<EventDeclaration,null>()

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
				result.addWarning(token.error('event not fully implemented'))
				break
			case 'inline':
				result.addError(token.error('not available for events'))
				break
			default: return exhaust(value)
		}
	}

	program.fnStore.appendToEvent(decl,new Interspercer())

	return result.wrap(decl)
	
}