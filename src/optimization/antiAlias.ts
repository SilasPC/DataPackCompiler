
import { Instruction, InstrType, INT_OP } from "../codegen/Instructions";
import { findLocalIntLifeSpans, replaceInt } from "./helpers";
import { FnFile } from "../codegen/FnFile";

/** Removes local variables that act as aliases */
export function antialias(fn:FnFile) {
	
	// one at a time to prevent overlaps
	let alias = findLocalIntLifeSpans(fn.get())[0]

	if (!alias) return false

	let [into,from,i,j] = alias
	// replace all uses
	replaceInt(into,from,fn.get().slice(i,j))
	// remove assignation
	fn.get().splice(i,1)

	return true

}