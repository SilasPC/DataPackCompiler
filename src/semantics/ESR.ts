import { ValueType, ElementaryValueType } from "./Types";

export type ESR = VoidESR | IntESR | BoolESR

export interface ESRBase {
	mutable: boolean
	const: boolean
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
	scoreboard?: string
	selector?: string
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
			const exhaust: never = esr
	}
	throw new Error('exhaustion')
}
