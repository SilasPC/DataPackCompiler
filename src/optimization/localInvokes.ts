
import { Instruction, InstrType, INT_OP } from "../codegen/Instructions";
import { findLocalIntLifeSpans, replaceInt } from "./helpers";
import { FnFile } from "../codegen/FnFile";

/** Removes local variables that act as aliases */
export function localInvokes(fn:FnFile) {
	
	let instrs = fn.get()

	let success = false

	for (let i = instrs.length - 1; i >= 0; i--) {
		let instr = instrs[i]
		if (instr.type != InstrType.LOCAL_INVOKE) continue
		instr.fn.declareDead()
		instrs.splice(i,1,...instr.fn.get())
		success = true
	}

	return success

}