import { Optimizer } from "./instructionOptimizer";
import { Datapack } from "../codegen/Datapack";
import { CompileContext } from "../toolbox/CompileContext";
import { Instruction, InstrType, INT_OP } from "../codegen/Instructions";

/** Removes local variables that act as aliases */
export function test(instrs:Instruction[]) {

	// Find int assignations to temporary variables
	let tmps = instrs.flatMap(
		(I,i) => (
			I.type == InstrType.INT_OP && I.into.tmp && I.op == '='
		) ? [[I,i] as [INT_OP,number]] : []
	)

	// Find alias lifespan (in case var is reused / overwritten later)
	let lifespans = tmps.map(
		([I,i]) => {
			let indices = tmps.filter(([I2,j]) => I == I2 && j > i).map(x=>x[1])
			let j = Math.min(...indices,instrs.length-1)
			return [I,i,j] as [INT_OP,number,number]
		}
	)

	// Filter out ones that get mutated during lifespan
	let aliases = lifespans.filter(
		([I,i,j]) => !instrs.slice(i+1,j).some(I2=>I2.type == InstrType.INT_OP && I2.into == I.into)
	)
	
	console.log('antialias',...aliases.map(x=>[x[0].into.scoreboard.selector,x[1],x[2]]))

	return {success:aliases.length > 0}

}