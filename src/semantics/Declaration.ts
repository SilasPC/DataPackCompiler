
import { ASTFnNode, ASTLetNode } from "../syntax/AST";
import { ValueType } from "./Types";
import { Instruction } from "./Instructions";

export type Declaration = VarDeclaration | FnDeclaration

export enum DeclarationType {
	VARIABLE,
	FUNCTION
}

export interface VarDeclaration {
	type: DeclarationType.VARIABLE
	node: ASTLetNode
	varType: ValueType
}

export interface FnDeclaration {
	type: DeclarationType.FUNCTION
	node: ASTFnNode
	returnType: ValueType,
	instructions: Instruction[]
}
