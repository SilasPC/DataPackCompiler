
import { ParsingFile } from "../lexing/ParsingFile";
import { CompileContext } from "../toolbox/CompileContext";
import { Datapack } from "./Datapack";
import { FnDeclaration } from "../semantics/Declaration";
import { exhaust } from "../toolbox/other";
import { InstrType } from "../semantics/Instructions";

export function generate(pf: ParsingFile, ctx: CompileContext) {
	// ...
}

export function generateTest(fn: FnDeclaration, ctx: CompileContext) {

	let output: string[] = []

	for (let instr of fn.instructions) {

		switch (instr.type) {

			case InstrType.INT_OP:
				if (!['=','+=','-=','*=','/=','%=']) throw new Error('invalid int op')
				// if (!instr.into.mutable) throw new Error('not mutable boi')
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
				output.push('#invoke')
				// TODO
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