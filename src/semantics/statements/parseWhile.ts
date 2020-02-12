import { ASTLetNode, ASTWhileNode } from "../../syntax/AST"
import { Logger } from "../../toolbox/Logger"
import { MaybeWrapper, Maybe } from "../../toolbox/Maybe"
import { parseExpression } from "../expressionParser"
import { ValueType, tokenToType, Type, isSubType } from "../types/Types"
import { ptExprToType, PTExpr, PTWhileNode, PTKind } from "../ParseTree"
import { Declaration, VarDeclaration, DeclarationType } from "../declarations/Declaration"
import { Scope } from "../Scope"
import { parseBody } from "../parseBody"


export function parseWhile(node: ASTWhileNode, scope:Scope, log:Logger): Maybe<PTWhileNode> {
	const maybe = new MaybeWrapper<PTWhileNode>()

	let pt = parseExpression(node.clause,scope,log)
	let body = parseBody(node.body,scope.branch('while'),log)

	if (!pt.value || !body.value) return maybe.none()

	if (ptExprToType(pt.value).type != Type.BOOL) {
		log.addError(node.clause.error('expected boolean expression'))
		return maybe.none()
	}

	return maybe.wrap({
		kind: PTKind.WHILE,
		clause: pt.value,
		body: body.value,
		scopeNames: scope.getScopeNames()
	})
	
}