import { createAbs } from "./math/abs";
import { CompileContext } from "../toolbox/CompileContext";
import { Declaration } from "../semantics/Declaration";

type Lib = {[key:string]:Lib|((ctx:CompileContext)=>Declaration)}

const lib: Lib  = {
	'Math': {
		abs: createAbs
	}
}

export class CoreLibrary {

	constructor(
		private readonly ctx: CompileContext
	) {}

	getFetcher() {return this.fetcher.bind(this)}

	private fetcher(lib:string) {
		return null
	}

}