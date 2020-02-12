import { ASTEventNode, ASTNodeType } from "../../syntax/AST"
import { Scope } from "../Scope"
import { Logger } from "../../toolbox/Logger"
import { Maybe, MaybeWrapper } from "../../toolbox/Maybe"
import { PTKind, PTEventNode } from "../ParseTree"
import { EventDeclaration, DeclarationType } from "../declarations/Declaration"
import { Program } from "../managers/ProgramManager"
import { CommentInterspercer } from "../../toolbox/CommentInterspercer"

export function parseEvent(node: ASTEventNode, scope:Scope, log:Logger, program: Program): Maybe<EventDeclaration> {
	const maybe = new MaybeWrapper<EventDeclaration>()

	let decl: EventDeclaration = {
        type: DeclarationType.EVENT,
        namePath: scope.nameAppend(node.identifier.value)
	}

	program.parseTree.appendToEvent(decl,new CommentInterspercer())

	return maybe.wrap(decl)
	
}