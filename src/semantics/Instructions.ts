
import { IntESR } from './ESR'
import { FnDeclaration } from './Declaration'

export type Instruction = INT_OP | CMDInstr | INVOKE

export enum InstrType {
	INVOKE,
	INT_OP,
	CMD
}

export interface INT_OP {
	type: InstrType.INT_OP
	into: IntESR
	from: IntESR
	op: string
}

export interface INVOKE {
	type: InstrType.INVOKE,
	fn: FnDeclaration
}

export interface CMDInstr {
	type: InstrType.CMD
}
