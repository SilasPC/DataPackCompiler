
import { Instruction, InstrType, INT_OP } from "../codegen/Instructions";
import { findLocalIntLifeSpans, replaceInt } from "./helpers";
import { FnFile } from "../codegen/FnFile";

/** Removes local variables that act as aliases */
export function antialias(fn:FnFile) {
	
	let aliases = findLocalIntLifeSpans(fn.get())

	// console.log('antialias',...aliases.map(x=>[x[0].scoreboard.selector,x[1],x[2]]))

	for (let [into,from,i,j] of aliases) {
		// replace all uses
		replaceInt(into,from,fn.get().slice(i,j))
		// remove assignation
		fn.get().splice(i,1)
	}

	return aliases.length > 0

}