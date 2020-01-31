
import { FnDeclaration } from '../semantics/Declaration'
import { FnFile } from './FnFile'
import { CMDNode } from '../commands/CMDNode'
import { ASTExpr } from '../syntax/AST'
import { Scoreboard } from './ScoreboardManager'
import { exhaust } from '../toolbox/other'
import { InstrWrapper } from './InstrWrapper'

export type Instruction = INT_OP | CMDInstr | INVOKE | LOCAL_INVOKE

export enum InstrType {
	LOCAL_INVOKE,
	INVOKE,
	INT_OP,
	CMD
}

export interface INT_OP {
	type: InstrType.INT_OP
	into: Scoreboard
	from: Scoreboard
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
	raw: string
}

export function instrsToCmds(instrs:InstrWrapper,into:string[],getFn:(fnf:FnFile)=>string) {
	for (let i of instrs.interateInto(into)) {
		switch (i.type) {
			case InstrType.CMD:
				into.push(i.raw)
				break
			case InstrType.INT_OP:
				into.push(`scoreboard players operation ${i.into.selector} ${i.into.scoreboard} ${i.op} ${i.from.selector} ${i.from.scoreboard}`)
				break
			case InstrType.LOCAL_INVOKE:
			case InstrType.INVOKE:
				into.push(`function ${getFn(i.fn)}`)
				break
			default:
				return exhaust(i)
		}
	}
	return into
}
