
import { IntESR } from '../semantics/ESR'
import { FnDeclaration } from '../semantics/Declaration'
import { FnFile } from './FnFile'

export type Instruction = INT_OP | CMDInstr | INVOKE | LOCAL_INVOKE

export enum InstrType {
	LOCAL_INVOKE,
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
	fn: FnFile
}

export interface LOCAL_INVOKE {
	type: InstrType.LOCAL_INVOKE,
	fn: FnFile
}

export interface CMDInstr {
	type: InstrType.CMD
}
