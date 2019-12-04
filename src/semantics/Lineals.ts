
import { IntESR } from './ESR'

export type Lineal = INT_OP | CMDLineal

export enum LinealType {
	INT_OP,
	CMD
}

export interface INT_OP {
	type: LinealType.INT_OP
	into: IntESR
	from: IntESR
	op: string
}

export interface CMDLineal {
	type: LinealType.CMD
}
