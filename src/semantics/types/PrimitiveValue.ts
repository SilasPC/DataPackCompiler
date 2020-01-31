import { ValueType, Type } from "./Types";

export type Primitive = IntPrim | BoolPrim | SelPrim

export function primToType(prim:Primitive): ValueType {
	return {type:prim.type}
}

export interface IntPrim {
	type: Type.INT
	value: number
}

export interface BoolPrim {
	type: Type.BOOL
	value: boolean
}

export interface SelPrim {
	type: Type.SELECTOR
}
