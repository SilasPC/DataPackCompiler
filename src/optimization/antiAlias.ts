
import { Instruction, InstrType, INT_OP } from "../codegen/Instructions";
import { findLocalIntLifeSpans, replaceInt } from "./helpers";
import { FnFile } from "../codegen/FnFile";

/** Removes local variables that act as aliases */
export function antialias(fn:FnFile) {
	
	// one at a time to prevent overlaps
	let alias = findLocalIntLifeSpans(fn)[0]

	if (!alias) return false

	let [into,from,i,j] = alias
	// replace all uses
	replaceInt(into,from,fn.getInstrs().slice(i,j))
	// remove assignation
	fn.remove(i,1)

	return true

}