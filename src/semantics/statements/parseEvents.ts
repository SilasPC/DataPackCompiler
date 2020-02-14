import { ASTEventNode } from "../../syntax/AST"
import { Scope } from "../Scope"
import { Logger } from "../../toolbox/Logger"
import { Maybe, MaybeWrapper } from "../../toolbox/Maybe"
import { EventDeclaration, DeclarationType } from "../declarations/Declaration"
import { Program } from "../managers/ProgramManager"
import { Interspercer } from "../../toolbox/Interspercer"

export function parseEvent(node: ASTEventNode, scope:Scope, log:Logger, program: Program): Maybe<EventDeclaration> {
	const maybe = new MaybeWrapper<EventDeclaration>()

	let decl: EventDeclaration = {
        type: DeclarationType.EVENT,
        namePath: scope.nameAppend(node.identifier.value)
	}

	program.parseTree.appendToEvent(decl,new Interspercer())

	return maybe.wrap(decl)
	
}