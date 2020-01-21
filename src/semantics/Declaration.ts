
import { ValueType } from "./types/Types";
import { ESR } from "./ESR";
import { FnFile } from "../codegen/FnFile";
import { TokenI } from "../lexing/Token";
import { Maybe } from "../toolbox/Maybe";
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
	type: DeclarationType.STRUCT
	struct: Struct
}

export interface RecipeDeclaration {
	type: DeclarationType.RECIPE
}

export interface ModDeclaration {
	type: DeclarationType.MODULE
	symbols: ReadOnlySymbolTable
}

export interface VarDeclaration {
	type: DeclarationType.VARIABLE
	varType: ValueType
	esr: ESR
}

export interface FnDeclaration {
	type: DeclarationType.FUNCTION
	thisBinding: ESR | null
	returns: ESR | null
	parameters: Maybe<{ref:boolean,param:ESR}>[]
	fn: FnFile
}
