import { Datapack } from "../codegen/Datapack";
import { CompileContext } from "../toolbox/CompileContext";
// import { antiAlias } from "./AntiAlias";

export type Optimizer = (dp:Datapack,ctx:CompileContext) => {success:boolean}

const optimizers: Optimizer[] = []

export function optimize(dp:Datapack,ctx:CompileContext) {
	let allFailed: boolean
	let passes = 0
	do {
		allFailed = true
		for (let opt of optimizers) {
			let res = opt(dp,ctx)
			if (res.success) {
				allFailed = false
				passes++
			}
		}
	} while (!allFailed)
	return {
		meta: {
			passes
		}
	}
}