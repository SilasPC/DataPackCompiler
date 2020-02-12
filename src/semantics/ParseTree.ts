import { VarDeclaration, FnDeclaration, ModDeclaration, EventDeclaration } from "./declarations/Declaration";
import { Primitive, primToType } from "./types/PrimitiveValue";
import { Operator } from "../lexing/values";
import { ValueType } from "./types/Types";
import { exhaust } from "../toolbox/other";
import { CMDNode } from "../commands/CMDNode";
import { CommentInterspercer } from "../toolbox/CommentInterspercer";

export class ParseTreeStore {

	public readonly init: PTBody = new CommentInterspercer<PTStatement>()
	private readonly fns = new Map<FnDeclaration,PTBody>()
	private readonly events = new Map<EventDeclaration,PTBody[]>()

	addFn(decl:FnDeclaration,body:PTBody) {
		if (this.fns.has(decl)) throw new Error('tried resetting fn decl body')
		this.fns.set(decl,body)
	}

	appendToEvent(decl:EventDeclaration,body:PTBody) {
		if (this.events.has(decl)) (this.events.get(decl) as PTBody[]).push(body)
		else this.events.set(decl,[body])
	}

	fnEntries() {return this.fns.entries()}

	eventEntries() {return this.events.entries()}

}

export function ptExprToType(pt:PTExpr): ValueType {
	switch (pt.kind) {
		case PTKind.VARIABLE:
			return pt.decl.varType
		case PTKind.PRIMITIVE:
			return primToType(pt.value)
		case PTKind.INVOKATION:
			return pt.func.returns
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
export type PTStatement = PTExpr | PTCmdNode | PTIfNode | PTWhileNode

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
	EVENT
}

export type PTBody = CommentInterspercer<PTStatement>

export interface PTEventNode {
	kind: PTKind.EVENT
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
	interpolations: {node:CMDNode,capture:string,pt:PTExpr|null}[]
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
	func: FnDeclaration
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

