
import { ASTFnNode, ASTLetNode } from "../syntax/AST";
import { ValueType } from "./Types";
import { Instruction } from "./Instructions";
import { ESR } from "./ESR";

export type Declaration = ImplicitVarDeclaration | VarDeclaration | FnDeclaration

export enum DeclarationType {
	VARIABLE,
	IMPLICIT_VARIABLE,
	FUNCTION
}

export interface ImplicitVarDeclaration {
	type: DeclarationType.IMPLICIT_VARIABLE,
	varType: ValueType,
	esr: ESR
}

export interface VarDeclaration {
	type: DeclarationType.VARIABLE
	node: ASTLetNode
	varType: ValueType
	esr: ESR
}

export interface FnDeclaration {
	type: DeclarationType.FUNCTION
	node: ASTFnNode
	returns: ESR
	parameters: ESR[]
	instructions: Instruction[]
}
