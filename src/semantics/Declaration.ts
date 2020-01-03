
import { ASTFnNode, ASTLetNode } from "../syntax/AST";
import { ValueType } from "./Types";
import { Instruction } from "../codegen/Instructions";
import { ESR } from "./ESR";
import { FnFile } from "../codegen/FnFile";
import { Token } from "../lexing/Token";
import { exhaust } from "../toolbox/other";

export function extractToken(decl:Declaration): Token {
	switch (decl.type) {
		case DeclarationType.FUNCTION:
		case DeclarationType.VARIABLE:
			return decl.node.identifier
		case DeclarationType.IMPLICIT_VARIABLE:
			return decl.token
		default:
			return exhaust(decl)
	}
}

export type Declaration = ImplicitVarDeclaration | VarDeclaration | FnDeclaration

export enum DeclarationType {
	VARIABLE,
	IMPLICIT_VARIABLE,
	FUNCTION
}

export interface ImplicitVarDeclaration {
	type: DeclarationType.IMPLICIT_VARIABLE
	token: Token
	varType: ValueType
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
	fn: FnFile
}
