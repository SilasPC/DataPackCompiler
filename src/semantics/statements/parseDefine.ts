import { MaybeWrapper } from "../../toolbox/Maybe"
import { Declaration, DeclarationType } from "../Declaration"
import { exprParser } from "../expressionParser"
import { ValueType, tokenToType, ElementaryValueType, hasSharedType } from "../Types"
import { copyESR, getESRType } from "../ESR"
import { ASTLetNode } from "../../syntax/AST"
import { Scope } from "../Scope"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseDefine(node: ASTLetNode,scope:Scope,ctx:CompileContext) {
	const maybe = new MaybeWrapper<Declaration>()

	let esr0 = exprParser(node.initial,scope,ctx,false)

	let type: ValueType | null = null
	if (node.typeToken) {
		type = tokenToType(node.typeToken,scope.symbols)
		if (type.elementary && type.type == ElementaryValueType.VOID) {
			ctx.addError(node.typeToken.error(`Cannot declare a variable of type 'void'`))
			return maybe.none()
		}
		if (!type.elementary) node.typeToken.throwDebug('no non-elemn rn k')
	}

	if (maybe.merge(esr0)) return maybe.none()
	let res = copyESR(esr0.value,ctx,scope,node.identifier.value,{tmp:false,mutable:true,const:false})
	let esr = res.esr
	// do something with res.copyInstr

	if (!type) type = getESRType(esr0.value)
	if (!hasSharedType(getESRType(esr),type)) {
		ctx.addError(node.identifier.error('type mismatch'))
		return maybe.none()
	}

	return maybe.wrap({type:DeclarationType.VARIABLE,varType:type,esr})
	
}