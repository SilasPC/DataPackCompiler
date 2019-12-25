import { Instruction, InstrType, INT_OP } from "../codegen/Instructions"
import { IntESR } from "../semantics/ESR"
import { exhaust } from "../toolbox/other"

export function replaceInt(target:IntESR,replacee:IntESR,instrs:Instruction[]): void {
	for (let instr of instrs) {
		switch (instr.type) {
			case InstrType.INT_OP:
				if (instr.from == target) instr.from == replacee
				if (instr.into == target) instr.into = replacee
				break
			case InstrType.CMD:
				console.log('warning: need cmd esr interface')
				break
			case InstrType.LOCAL_INVOKE:
				replaceInt(target,replacee,instr.fn.get())
				break
			case InstrType.INVOKE:
				break
			default:
				return exhaust(instr)
		}
	}
}

export function findLocalIntLifeSpans(instrs:Instruction[]) {
	
	// Find all IntESR mutations on temporary variables
	let tmps = instrs.flatMap(
		(I,i) => {
			let esr = extractIntESRs(I)
			if (esr) return [[...esr,i]] as [IntESR,IntESR,number][]
			return []
		}
	)

	// Find alias lifespan (in case var is reused / overwritten later)
	let lifespans = tmps.map(
		([into,from,i]) => {
			let indices = tmps.filter(([esr2,_,j]) => into == esr2 && j > i).map(x=>x[2])
			let j = Math.min(...indices,instrs.length-1)
			return [into,from,i,j] as [IntESR,IntESR,number,number]
		}
	)

	// Filter out ones that get mutated during lifespan
	let aliases = lifespans.filter(
		([into,from,i,j]) => !isMutated(into,instrs.slice(i+1,j))
	)

	// console.log(tmps,lifespans)

	return aliases

}

function isMutated(esr:IntESR,instrs:Instruction[]) {
	for (let instr of instrs) {
		switch (instr.type) {
			case InstrType.INT_OP:
				if (instr.into == esr) return true
				break
			case InstrType.LOCAL_INVOKE:
				if (isMutated(esr,instr.fn.get())) return true
				break
			case InstrType.CMD:
				console.log('warning: cmds need an esr interface')
			case InstrType.INVOKE:
				break
			default:
				return exhaust(instr)
		}
	}
	return false
}

function extractIntESRs(I:Instruction): [IntESR,IntESR] | null {
	if (I.type == InstrType.INT_OP && I.into.tmp && I.op == '=') return [I.into,I.from]
	return null
}
