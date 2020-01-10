
import { ASTFnNode, ASTLetNode, ASTNode } from "../syntax/AST";
import { ValueType } from "./Types";
import { Instruction } from "../codegen/Instructions";
import { ESR } from "./ESR";
import { FnFile } from "../codegen/FnFile";
import { TokenI } from "../lexing/Token";
import { exhaust } from "../toolbox/other";
import { Maybe } from "../toolbox/Maybe";

export type Declaration = VarDeclaration | FnDeclaration

export interface DeclarationWrapper {
	token: TokenI
	decl: Declaration
}

export enum DeclarationType {
	VARIABLE,
	FUNCTION
}

export interface VarDeclaration {
	type: DeclarationType.VARIABLE
	varType: ValueType
	esr: ESR
}

export interface FnDeclaration {
	type: DeclarationType.FUNCTION
	esr: ESR
	parameters: Maybe<{ref:boolean,param:ESR}>[]
	fn: FnFile
}
