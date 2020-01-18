import { TokenI, TokenType } from "../../lexing/Token";
import { SymbolTable } from "../SymbolTable";
import { exhaust } from "../../toolbox/other";
import { Struct } from "./Struct";

export enum Type {
	INT,
	BOOL,
	VOID,
	SELECTOR,
	STRUCT
}

export type ValueType = SimpleValueType | Struct | SelectorValue

export interface SimpleValueType {
	type: Type.VOID | Type.BOOL | Type.INT
}

export interface SelectorValue {
	type: Type.SELECTOR
}

export function tokenToType(token:TokenI,symbols:SymbolTable): ValueType {
	if (token.type == TokenType.TYPE) {
		switch (token.value) {
			case 'bool': return {type:Type.BOOL}
			case 'int': return {type:Type.INT}
			case 'void': return {type:Type.VOID}
			case 'selector': return {type:Type.SELECTOR}
			default:
				return exhaust(token.value)
		}
	}
	throw new Error('only elementary types for now')
	// let decl = symbols.getDeclaration(token)
}

export function isSubType(sup:ValueType,sub:ValueType): boolean {
	if (sup.type != sub.type) return false
	switch (sup.type) {
		case Type.INT:
		case Type.BOOL:
		case Type.VOID:
			return true
		case Type.SELECTOR:
			throw new Error('no selector subtype check yet')
		case Type.STRUCT:
			return sup.checkIsSubType(sub as Struct)
		default:
			return exhaust(sup)
	}
}
