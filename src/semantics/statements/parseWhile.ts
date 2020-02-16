import { ASTLetNode, ASTWhileNode } from "../../syntax/AST"
import { Logger } from "../../toolbox/Logger"
import { parseExpression } from "../expressionParser"
import { ValueType, tokenToType, Type, isSubType } from "../types/Types"
import { ptExprToType, PTExpr, PTWhileNode, PTKind } from "../ParseTree"
import { Declaration, VarDeclaration, DeclarationType } from "../declarations/Declaration"
import { Scope } from "../Scope"
import { parseBody } from "../parseBody"
import { CompilerOptions } from "../../toolbox/config"
import { DirectiveToken } from "../../lexing/Token"
import { Result, ResultWrapper } from "../../toolbox/Result"


export function parseWhile(node: ASTWhileNode, scope:Scope, log:Logger, cfg: CompilerOptions): Result<PTWhileNode,null> {
	const result = new ResultWrapper<PTWhileNode,null>()

	let pt = parseExpression(node.clause,scope,log)
	let body = parseBody(node.body,scope.branch('while'),log,cfg)

	if (result.merge(pt) || result.merge(body)) return result.none()

	if (ptExprToType(pt.getValue()).type != Type.BOOL) {
		log.addError(node.clause.error('expected boolean expression'))
		return result.none()
	}

	return result.wrap({
		kind: PTKind.WHILE,
		clause: pt.getValue(),
		body: body.getValue(),
		scopeNames: scope.getScopeNames()
	})
	
}