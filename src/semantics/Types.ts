import { TokenI, TokenType } from "../lexing/Token";
import { SymbolTable } from "./SymbolTable";

export type ValueType = ElementaryValue | NonElementaryValue

export interface ElementaryValue {
	elementary: true
	type: ElementaryValueType
}

export interface NonElementaryValue {
	elementary: false
}

export enum ElementaryValueType {
	INT,
	BOOL,
	VOID,
	SELECTOR
}

export function tokenToType(token:TokenI,symbols:SymbolTable): ValueType {
	if (token.type == TokenType.TYPE) {
		let type = token.value.toUpperCase() as keyof typeof ElementaryValueType
		if (!(type in ElementaryValueType)) throw new Error('missing elementary value for '+type)
		return {elementary:true,type:ElementaryValueType[type]}
	}
	throw new Error('only elementary types for now')
	// let decl = symbols.getDeclaration(token)
}

export function hasSharedType(...v:ValueType[]): boolean {
	if (v.some(vt=>vt.elementary!=v[0].elementary)) return false
	if (v[0].elementary) return (v as ElementaryValue[]).every(vt=>vt.type==(v[0] as ElementaryValue).type)
	throw new Error('no non-elementaries for now')
}
