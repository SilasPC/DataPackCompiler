import { ValueType, ElementaryValueType } from "./Types";
import { exhaust } from "../toolbox/other";
import { Instruction, INT_OP, InstrType } from "./Instructions";
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
		case ESRType.VOID: return {elementary:true,type:ElementaryValueType.VOID}
		case ESRType.INT: return {elementary:true,type:ElementaryValueType.INT}
		case ESRType.BOOL: return {elementary:true,type:ElementaryValueType.BOOL}
		default:
			return exhaust(esr)
	}
}

/** Copies esr into a new esr (with the returned instruction) */
export function copyESRToLocal(esr:ESR,ctx:CompileContext,scope:Scope,name:string): {copyInstr:Instruction,esr:ESR} {
	switch (esr.type) {
		case ESRType.VOID:
			throw new Error('cannot copy void esr')
		case ESRType.BOOL:
			throw new Error('bool copy not supported yet')
		case ESRType.INT:
			let retEsr: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:false,scoreboard:ctx.scoreboards.getStatic(name,scope)}
			let copyInstr: INT_OP = {type:InstrType.INT_OP,into:retEsr,from:esr,op:'='}
			return {copyInstr,esr:retEsr}
		default:
			return exhaust(esr)
	}
}
