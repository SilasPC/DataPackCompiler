
import { ASTFnNode, ASTLetNode } from "../syntax/AST";
import { ValueType } from "./Types";
import { Instruction } from "./Instructions";
import { ESR } from "./ESR";

export type Declaration = VarDeclaration | FnDeclaration

export enum DeclarationType {
	VARIABLE,
	FUNCTION
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
