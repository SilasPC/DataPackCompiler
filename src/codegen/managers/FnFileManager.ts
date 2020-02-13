import { FnFile } from "../FnFile";
import { CompilerOptions } from "../../toolbox/config";
import { getObscureName, getQualifiedName } from "../../toolbox/other";
import { FnDeclaration, EventDeclaration } from "../../semantics/declarations/Declaration";
import $ from 'js-itertools'
import { IChainableIterable } from "js-itertools/lib/src/types";
import { Config } from "../../api/Configuration";

export class FnFileManager {

	private readonly fns = new Map<string|FnDeclaration|EventDeclaration,FnFile>()

	constructor(
		private readonly cfg: Config
	) {}

	byDeclaration(decl:FnDeclaration|EventDeclaration): FnFile {
		if (this.fns.has(decl)) return this.fns.get(decl) as FnFile
		let name: string
		if (this.cfg.compilation.obscureNames)
			name = getObscureName(this.fns)
		else
			name = getQualifiedName(decl.namePath,this.fns,Infinity)
		let fn = new FnFile(this.cfg.pack.namespace+':'+name,decl.namePath)
		this.fns.set(decl,fn).set(name,fn)
		return fn
	}

	createFn(names:ReadonlyArray<string>) {
		let name: string
		if (this.cfg.compilation.obscureNames)
			name = getObscureName(this.fns)
		else
			name = getQualifiedName(names,this.fns,Infinity)
		let fn = new FnFile(this.cfg.pack.namespace+':'+name,names)

		this.fns.set(name,fn)
		return fn
	}

	all() {return $(this.fns).filter(([n])=>typeof n == 'string') as IChainableIterable<[string,FnFile]>}

}