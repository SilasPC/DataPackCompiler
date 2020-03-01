import { VarDeclaration, FnDeclaration, ModDeclaration, EventDeclaration, DeclarationType } from "./declarations/Declaration";
import { Primitive, primToType } from "./types/PrimitiveValue";
import { Operator } from "../lexing/values";
import { ValueType, Type } from "./types/Types";
import { exhaust } from "../toolbox/other";
import { Interspercer } from "../toolbox/Interspercer";
import { CMDInterpolation } from "../commands/interpolation";

export function knownAtCompileTime(pt:PTExpr): Primitive | null {
	switch (pt.kind) {
		case PTKind.VARIABLE:
			return pt.decl.knownAtCompileTime
		case PTKind.PRIMITIVE:
			return pt.value
		case PTKind.INVOKATION:
			return null
		case PTKind.OPERATOR:
			let vals = pt.vals.map(knownAtCompileTime)
			if (vals.some(v=>!v)) return null
			switch (pt.op) {
				/*
					need to figure out what to do here
					this needs to be centralized, such that
					generation does not accidentally yield something different
				*/
				case '!':
				
				case '&&':
				case '||':
				
				case '=':

				case '==':
				case '!=':

				case '>':
				case '>=':
				case '<':
				case '<=':

				case '++':
				case '--':

				case '+=':
				case '-=':
				case '*=':
				case '/=':
				case '%=':
				case '+':
				case '-':
				case '*':
				case '/':
				case '%':
					return null
				default: return exhaust(pt.op)
			}
			return knownAtCompileTime(pt)
		default: return exhaust(pt)
	}
}

export function ptExprToType(pt:PTExpr): ValueType {
	switch (pt.kind) {
		case PTKind.VARIABLE:
			return pt.decl.varType
		case PTKind.PRIMITIVE:
			return primToType(pt.value)
		case PTKind.INVOKATION:
			switch (pt.func.type) {
				case DeclarationType.EVENT: return {type:Type.VOID}
				case DeclarationType.FUNCTION: return pt.func.returns
				default: return exhaust(pt.func)
			}
		case PTKind.OPERATOR:
			return pt.type
		default: return exhaust(pt)
	}
}

export function ptCanMut(pt:PTExpr) {
	switch (pt.kind) {
		case PTKind.VARIABLE: // want a binding on decl here
			return pt.decl.mutable
		case PTKind.PRIMITIVE:
		case PTKind.INVOKATION:
			case PTKind.OPERATOR:
			return false
		default: return exhaust(pt)
	}
}

export type PTStatic = PTFnNode | PTModNode | PTEventNode
export type PTExpr = PTVarNode | PTPrimitiveNode | PTCallNode | PTOpNode
export type ParseTree = PTStatic | PTExpr
export type PTStatement = PTExpr | PTCmdNode | PTIfNode | PTWhileNode | PTReturn

export enum PTKind {
	FUNCTION,
	MODULE,
	VARIABLE,
	PRIMITIVE,
	INVOKATION,
	OPERATOR,
	COMMAND,
	CONDITIONAL,
	WHILE,
	EVENT,
	RETURN
}

export type PTBody = Interspercer<PTStatement,string>

export interface PTEventNode {
	kind: PTKind.EVENT
}

export interface PTReturn {
	kind: PTKind.RETURN
	fn: FnDeclaration
	expr: PTExpr | null
	type: ValueType
}

export interface PTIfNode {
	kind: PTKind.CONDITIONAL
	clause: PTExpr
	ifDo: PTBody
	elseDo: PTBody
	scopeNames: string[]
}

export interface PTCmdNode {
	kind: PTKind.COMMAND
	interpolations: CMDInterpolation
	raw: string
	scopeNames: string[]
}

export interface PTWhileNode {
	kind: PTKind.WHILE
	clause: PTExpr
	body: PTBody
	scopeNames: string[]
}

export interface PTModNode {
	kind: PTKind.MODULE
	decl: ModDeclaration
}

export interface PTCallNode {
	kind: PTKind.INVOKATION
	func: FnDeclaration | EventDeclaration
	args: ({ref:true,pt:PTVarNode}|{ref:false,pt:PTExpr})[]
	scopeNames: string[]
}

export interface PTOpNode {
	kind: PTKind.OPERATOR
	op: Operator
	vals: PTExpr[]
	type: ValueType
	scopeNames: string[]
}

export interface PTFnNode {
	kind: PTKind.FUNCTION
	decl: FnDeclaration
}

export interface PTVarNode {
	kind: PTKind.VARIABLE
	decl: VarDeclaration
}

export interface PTPrimitiveNode {
	kind: PTKind.PRIMITIVE
	value: Primitive
	scopeNames: string[]
}

