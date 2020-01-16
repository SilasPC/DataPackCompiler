
import { Instruction, InstrType, INT_OP } from "../codegen/Instructions";
import { findLocalIntLifeSpans, replaceInt } from "./helpers";
import { FnFile } from "../codegen/FnFile";

/** Removes local invokes */
export function localInvokes(fn:FnFile) {
	
	let success = false

	fn.forEachReverse((instr,i)=>{
		if (instr.type != InstrType.LOCAL_INVOKE) return
		instr.fn.declareDead()
		fn.remove(i,1)
		fn.insert(i,instr.fn)
		success = true
	})

	return success

}