
import { ValueType, typeSignature, Type } from "./types/Types";
import { TokenI } from "../lexing/Token";
import { ReadOnlySymbolTable } from "./SymbolTable";
import { Struct } from "./types/Struct";

export type Declaration = VarDeclaration | FnDeclaration | ModDeclaration | RecipeDeclaration | StructDeclaration

export interface DeclarationWrapper {
	token: TokenI
	decl: Declaration
}

export enum DeclarationType {
	VARIABLE,
	FUNCTION,
	MODULE,
	RECIPE,
	STRUCT
}

export interface StructDeclaration {
	namePath: ReadonlyArray<string>
	type: DeclarationType.STRUCT
	struct: Struct
}

export interface RecipeDeclaration {
	namePath: ReadonlyArray<string>
	type: DeclarationType.RECIPE
}

export interface ModDeclaration {
	namePath: ReadonlyArray<string>
	type: DeclarationType.MODULE
	symbols: ReadOnlySymbolTable
}

export interface VarDeclaration {
	namePath: ReadonlyArray<string>
	type: DeclarationType.VARIABLE
	varType: ValueType
	mutable: boolean
}

export interface FnDeclaration {
	namePath: ReadonlyArray<string>
	type: DeclarationType.FUNCTION
	thisBinding: ValueType
	returns: ValueType
	parameters: {isRef:boolean,type:ValueType}[]
}

export function fnSignature(fn:FnDeclaration) {
	let params = fn.parameters.map(p=>(p.isRef?'ref ':'')+typeSignature(p.type))
	if (fn.thisBinding.type != Type.VOID)
		params.unshift(`this ${typeSignature(fn.thisBinding)}`)
	return `(${params.join(', ')}) -> ${typeSignature(fn.returns)}`
}
