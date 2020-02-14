
import { FnFile } from './FnFile'
import { Scoreboard } from './managers/ScoreboardManager'
import { exhaust } from '../toolbox/other'
import { InstrWrapper } from './InstrWrapper'
import { OutputManager } from './managers/OutputManager'
import { Config } from '../api/Configuration'

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

export function instrsToCmds(cfg:Config,output:OutputManager,useDebug:boolean,instrs:InstrWrapper,into:string[]) {
	let ic = 0
	for (let i of instrs.interateInto(into)) {
		switch (i.type) {
			case InstrType.CMD:
				into.push(i.raw)
				ic++
				break
			case InstrType.INT_OP:
				into.push(`scoreboard players operation ${i.into.selector} ${i.into.scoreboard} ${i.op} ${i.from.selector} ${i.from.scoreboard}`)
				ic++
				break
			case InstrType.LOCAL_INVOKE:
				into.push(`function ${i.fn.filePath}`)
				ic++
				break
			case InstrType.INVOKE:
				if (useDebug) {
					// stack trace add
					into.push(`data modify storage ${cfg.pack.namespace}:std stack append value "${i.fn.namePath.join('::')} => "`)
					ic++
				}
				into.push(`function ${i.fn.filePath}`)
				if (useDebug) {
					// stack trace remove
					into.push(`data remove storage ${cfg.pack.namespace}:std stack[-1]`)
					ic++
				}
				ic++
				break
			default:
				return exhaust(i)
		}
	}
	if (useDebug) {
		let counter = output.getInstrCounter()
		into.push(
			'','#> Debugging','',
			`scoreboard players add ${counter.selector} ${counter.scoreboard} ${ic+1}`
		)
	}
	return into
}
