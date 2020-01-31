import { FnFile } from "./FnFile";
import { CompilerOptions } from "../toolbox/config";
import { getObscureName, getQualifiedName } from "../toolbox/other";

export class FnFileManager {

	private readonly fns = new Map<string,FnFile>()
	private readonly revMap = new Map<FnFile,string>()

	constructor(
		private readonly options: CompilerOptions
	) {}

	createFn(names:ReadonlyArray<string>) {
		let name: string
		if (this.options.obscureNames)
			name = getObscureName(this.fns)
		else
			name = getQualifiedName(names,this.fns,Infinity)
		let fn = new FnFile(names)

		this.fns.set(name,fn)
		this.revMap.set(fn,name)
		return fn
	}

	all() {return this.fns}

	getName(fnf:FnFile) {return this.revMap.get(fnf)}

}