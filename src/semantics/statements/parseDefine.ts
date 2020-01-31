import { ASTLetNode } from "../../syntax/AST"
import { Logger } from "../../toolbox/Logger"
import { MaybeWrapper, Maybe } from "../../toolbox/Maybe"
import { parseExpression } from "../expressionParser"
import { ValueType, tokenToType, Type, isSubType } from "../types/Types"
import { ptExprToType, PTExpr } from "../ParseTree"
import { Declaration, VarDeclaration, DeclarationType } from "../Declaration"
import { Scope } from "../Scope"


export function parseDefine(node: ASTLetNode, scope:Scope, log:Logger): Maybe<{pt:PTExpr,decl:VarDeclaration}> {
	const maybe = new MaybeWrapper<{pt:PTExpr,decl:VarDeclaration}>()

	let pt = parseExpression(node.initial,scope,log)

	let type: ValueType | null = null
	if (node.typeToken) {
		type = tokenToType(node.typeToken,scope.symbols)
		if (type.type == Type.VOID) {
			log.addError(node.typeToken.error(`Cannot declare a variable of type 'void'`))
			return maybe.none()
		}
	}

	if (maybe.merge(pt)) return maybe.none()
	
	let ptType = ptExprToType(pt.value)
	if (!type) type = ptType
	if (!isSubType(type,ptType)) {
		log.addError(node.identifier.error('type mismatch'))
		return maybe.none()
	}

	const decl: VarDeclaration = {
		type: DeclarationType.VARIABLE,
		varType: type,
		mutable: !node.isConst,
		namePath: scope.nameAppend(node.identifier.value)
	}

	return maybe.wrap({decl,pt:pt.value})
	
}