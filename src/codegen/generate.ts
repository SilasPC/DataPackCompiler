
import { ParsingFile } from "../toolbox/ParsingFile";
import { CompileContext } from "../toolbox/CompileContext";
import { Datapack } from "./Datapack";
import { FnDeclaration } from "../semantics/Declaration";
import { exhaust } from "../toolbox/other";
import { InstrType } from "./Instructions";
import { FnFile } from "./FnFile";

export function generate(fn:FnFile) {
	
	let output: string[] = []

	for (let instr of fn.get()) {

		switch (instr.type) {

			case InstrType.INT_OP:
				if (!['=','+=','-=','*=','/=','%=']) throw new Error('invalid int op')
				output.push(`scoreboard players operation ${
					instr.into.scoreboard.selector
				} ${
					instr.into.scoreboard.scoreboard
				} ${instr.op} ${
					instr.from.scoreboard.selector
				} ${
					instr.from.scoreboard.scoreboard
				}`)
				break
			case InstrType.INVOKE:
				output.push(`function tmp:${instr.fn.name}`)
				break
			case InstrType.LOCAL_INVOKE:
				output.push(`function tmp:${instr.fn.name}`)
				break
			case InstrType.CMD:
				output.push('#cmd')
				// TODO
				break
			default:
				return exhaust(instr)
				
		}

	}

	return output

}

export function generateTest(fn: FnDeclaration, ctx: CompileContext) {

	let output: string[] = []

	for (let instr of fn.fn.get()) {

		switch (instr.type) {

			case InstrType.INT_OP:
				if (!['=','+=','-=','*=','/=','%=']) throw new Error('invalid int op')
				output.push(`scoreboard players operation ${
					instr.into.scoreboard.selector
				} ${
					instr.into.scoreboard.scoreboard
				} ${instr.op} ${
					instr.from.scoreboard.selector
				} ${
					instr.from.scoreboard.scoreboard
				}`)
				break
			case InstrType.INVOKE:
				output.push(`function tmp:${instr.fn.name}`)
				break
			case InstrType.LOCAL_INVOKE:
				output.push(`function tmp:${instr.fn.name}`)
				break
			case InstrType.CMD:
				output.push('#cmd')
				// TODO
				break
			default:
				return exhaust(instr)
				
		}

	}

	return output

}