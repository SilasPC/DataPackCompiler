
import { IntESR } from './ESR'
import { FnDeclaration } from './Declaration'

export type Instruction = INT_OP | CMDInstr | INVOKE_INT | INVOKE_VOID

export enum InstrType {
	INVOKE_INT,
	INVOKE_VOID,
	INT_OP,
	CMD
}

export interface INT_OP {
	type: InstrType.INT_OP
	into: IntESR
	from: IntESR
	op: string
}

export interface INVOKE_VOID {
	type: InstrType.INVOKE_VOID,
	fn: FnDeclaration
}

export interface INVOKE_INT {
	type: InstrType.INVOKE_INT,
	fn: FnDeclaration
	into: IntESR
}

export interface CMDInstr {
	type: InstrType.CMD
}
