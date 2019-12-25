import { Datapack } from "../codegen/Datapack";
import { CompileContext } from "../toolbox/CompileContext";
import { FnFile } from "../codegen/FnFile";
import { InstrType } from "../codegen/Instructions";
import { antialias } from "./antiAlias";
// import { antiAlias } from "./AntiAlias";

export type Optimizer = (fn:FnFile,ctx:CompileContext) => boolean

const optimizers: Optimizer[] = [antialias]

export function optimize(ctx:CompileContext) {
	let passes = ctx.getFnFiles().reduce((passes,fn)=>passes+recurseOptimize(fn,ctx),0)
	return {
		meta: {
			passes
		}
	}
}

function recurseOptimize(fn:FnFile,ctx:CompileContext) {
	let allFailed: boolean
	let passes = 0
	do {
		allFailed = true
		for (let opt of optimizers) {
			let res = opt(fn,ctx)
			if (res) {
				allFailed = false
				passes++
			}
		}
		if (allFailed) {
			let newPasses = 0
			for (let instr of fn.get()) {
				if (instr.type != InstrType.LOCAL_INVOKE) continue
				newPasses += recurseOptimize(instr.fn,ctx)
			}
			passes += newPasses
			if (newPasses > 0) allFailed = false
		}
	} while (!allFailed)
	return passes
}
