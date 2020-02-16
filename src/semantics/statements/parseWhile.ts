import { ASTWhileNode } from "../../syntax/AST"
import { parseExpression } from "../expressionParser"
import { Type } from "../types/Types"
import { ptExprToType, PTWhileNode, PTKind } from "../ParseTree"
import { Scope } from "../Scope"
import { parseBody } from "../parseBody"
import { CompilerOptions } from "../../toolbox/config"
import { Result, ResultWrapper } from "../../toolbox/Result"


export function parseWhile(node: ASTWhileNode, scope:Scope, cfg: CompilerOptions): Result<PTWhileNode,null> {
	const result = new ResultWrapper<PTWhileNode,null>()

	let pt = parseExpression(node.clause,scope)
	let body = parseBody(node.body,scope.branch('while'),cfg)

	if (result.merge(pt) || result.merge(body)) return result.none()

	if (ptExprToType(pt.getValue()).type != Type.BOOL) {
		result.addError(node.clause.error('expected boolean expression'))
		return result.none()
	}

	return result.wrap({
		kind: PTKind.WHILE,
		clause: pt.getValue(),
		body: body.getValue(),
		scopeNames: scope.getScopeNames()
	})
	
}