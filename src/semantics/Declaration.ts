
import { ASTFnNode, ASTLetNode, ASTNode } from "../syntax/AST";
import { ValueType } from "./Types";
import { Instruction } from "../codegen/Instructions";
import { ESR } from "./ESR";
import { FnFile } from "../codegen/FnFile";
import { TokenI } from "../lexing/Token";
import { exhaust } from "../toolbox/other";
import { Maybe, MaybeWrapper } from "../toolbox/Maybe";
import { SymbolTable, ReadOnlySymbolTable } from "./SymbolTable";
import { CompileContext } from "../toolbox/CompileContext";

export type Declaration = VarDeclaration | FnDeclaration | ModDeclaration | RecipeDeclaration

export interface DeclarationWrapper {
	token: TokenI
	decl: Declaration
}

export enum DeclarationType {
	VARIABLE,
	FUNCTION,
	MODULE,
	RECIPE
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
	returns: ESR
	parameters: Maybe<{ref:boolean,param:ESR}>[]
	fn: FnFile
}
