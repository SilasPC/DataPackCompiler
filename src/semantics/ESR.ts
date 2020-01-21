import { ValueType, Type, isSubType } from "./types/Types";
import { exhaust } from "../toolbox/other";
import { Instruction, INT_OP, InstrType } from "../codegen/Instructions";
import { CompileContext } from "../toolbox/CompileContext";
import { Scope } from "./Scope";

export type ESR = VoidESR | IntESR | BoolESR

export interface ESRBase {
	mutable: boolean
	const: boolean
	tmp: boolean
}

export enum ESRType {
	VOID,
	INT,
	BOOL
}

export interface VoidESR extends ESRBase {
	type: ESRType.VOID
}

export interface Scoreboard {
	scoreboard: string
	selector: string
}

export interface IntESR extends ESRBase {
	type: ESRType.INT
	scoreboard: Scoreboard
}

export interface BoolESR extends ESRBase {
	type: ESRType.BOOL
	scoreboard: Scoreboard
}

export function getESRType(esr:ESR): ValueType {
	switch (esr.type) {
		case ESRType.VOID: return {type:Type.VOID}
		case ESRType.INT: return {type:Type.INT}
		case ESRType.BOOL: return {type:Type.BOOL}
		default:
			return exhaust(esr)
	}
}

/** Assigns one esr var to another */
export function assignESR(from:ESR,to:ESR): Instruction[] {
	if (!isSubType(getESRType(from),getESRType(to))) throw new Error('cannot assign esrs, not same type')
	switch (from.type) {
		case ESRType.VOID:
			throw new Error('cannot assign void esr')
		case ESRType.BOOL:
			throw new Error('no assign bool esr yet')
		case ESRType.INT: {
			return [{
				type: InstrType.INT_OP,
				from,
				into: to as IntESR,
				op: '='
			}]
		}
		default:
			return exhaust(from)
	}
}

/** Copies esr into a new esr (with the returned instruction) */
export function copyESR<T extends ESR>(esr:T,ctx:CompileContext,names:string[],base:ESRBase): {copyInstr:Instruction,esr:T} {
	let esr0 = esr as ESR
	switch (esr0.type) {
		case ESRType.VOID:
			throw new Error('cannot copy void esr')
		case ESRType.BOOL:
			throw new Error('bool copy not supported yet')
		case ESRType.INT:
			let retEsr: IntESR = {type:ESRType.INT,...base,scoreboard:ctx.scoreboards.getStatic(names)}
			let copyInstr: INT_OP = {type:InstrType.INT_OP,into:retEsr,from:esr0,op:'='}
			return {copyInstr,esr:retEsr as T}
		default:
			return exhaust(esr0)
	}
}
