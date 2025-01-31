import { ASTLetNode } from "../../syntax/AST"
import { parseExpression } from "../expressionParser"
import { ValueType, tokenToType, Type, isSubType } from "../types/Types"
import { ptExprToType, PTExpr, PTOpNode, PTKind, knownAtCompileTime } from "../ParseTree"
import { VarDeclaration, DeclarationType } from "../declarations/Declaration"
import { Scope } from "../Scope"
import { ResultWrapper, Result } from "../../toolbox/Result"


export function parseDefine(node: ASTLetNode, scope:Scope): Result<{pt:PTExpr,decl:VarDeclaration},null> {
	const result = new ResultWrapper<{pt:PTExpr,decl:VarDeclaration},null>()

	let pt = parseExpression(node.initial,scope)

	let type: ValueType | null = null
	if (node.typeToken) {
		type = tokenToType(node.typeToken,scope.symbols)
		if (type.type == Type.VOID) {
			result.addError(node.typeToken.error(`Cannot declare a variable of type 'void'`))
			return result.none()
		}
	}

	if (result.merge(pt)) return result.none()
	
	let ptType = ptExprToType(pt.getValue())
	if (!type) type = ptType
	if (!isSubType(type,ptType)) {
		result.addError(node.identifier.error('type mismatch'))
		return result.none()
	}

	const decl: VarDeclaration = {
		type: DeclarationType.VARIABLE,
		varType: type,
		mutable: !node.isConst,
		namePath: scope.nameAppend(node.identifier.value),
		existsAtRunTime: true,
		knownAtCompileTime: node.isConst ? knownAtCompileTime(pt.getValue()) : null
	}

	const setPt: PTOpNode = {
		kind: PTKind.OPERATOR,
		op: '=',
		type: ptExprToType(pt.getValue()),
		vals: [
			{kind:PTKind.VARIABLE,decl},
			pt.getValue()
		],
		scopeNames: scope.getScopeNames()
	}

	return result.wrap({decl,pt:setPt})
	
}