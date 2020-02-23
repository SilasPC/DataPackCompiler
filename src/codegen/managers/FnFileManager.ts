import { FnFile } from "../FnFile";
import { FnDeclaration, EventDeclaration } from "../../semantics/declarations/Declaration";
import { Config } from "../../api/Configuration";
import { Namespace } from "./FileSpace";

export class FnFileManager extends Namespace<FnFile> {

	private readonly fns = new Map<FnDeclaration|EventDeclaration,FnFile>()

	constructor(
		private readonly cfg: Config
	) {super()}

	byDeclaration(decl:FnDeclaration|EventDeclaration): FnFile {
		let file = this.getFile(this.cfg.pack.namespace,decl.namePath)
		if (file) return file
		return this.addFile(this.cfg.pack.namespace,decl.namePath,fullPath=>{
			let mcPath = `${this.cfg.pack.namespace}:${fullPath.join('/')}`
			return new FnFile(mcPath,decl.namePath)
		})
	}

	createFn(names:readonly string[]) {
		let file = this.getFile(this.cfg.pack.namespace,names)
		if (file) return file
		return this.addFile(this.cfg.pack.namespace,names,fullPath=>{
			let mcPath = `${this.cfg.pack.namespace}:${fullPath.join('/')}`
			return new FnFile(mcPath,names)
		})
	}

	all() {
		return this.getAllFiles()
	}

}