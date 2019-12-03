import { Token, TokenType } from "../lexing/Token";
import { SymbolTable } from "./SymbolTable";
import { Declarations } from "./Declaration";
import { unionize, ofType, UnionOf, TagsOf, RecordOf, Creators, Unionized, UnionTypes } from 'unionize'

export const ValueTypes = unionize({
	ELEMENTARY: ofType<ElementaryValueType>(),
	NON_ELEMENTARY: {}
},{
	value: 'type'
})
export type ValueType = UnionOf<typeof ValueTypes>

export enum ElementaryValueType {
	INT,
	VOID
}

export function tokenToType(token:Token,symbols:SymbolTable): ValueType {

	if (token.type == TokenType.TYPE) {
		let type = token.value.toUpperCase() as keyof typeof ElementaryValueType
		if (!(type in ElementaryValueType)) throw new Error('missing elementary value for '+type)
		return ValueTypes.ELEMENTARY(ElementaryValueType[type])
	}

	let decl = symbols.getDeclaration(token.value)

	if (!decl) token.throwDebug('Type not defined')

	throw new Error('only elementary types for now')
	
}
