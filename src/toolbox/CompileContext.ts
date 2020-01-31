
import { CompilerOptions, compilerOptionDefaults } from "./config";
import { SyntaxSheet } from "../commands/SyntaxSheet";
import { ParsingFile } from "./ParsingFile";
import { resolve } from "path";
import { getObscureName, getQualifiedName } from "./other";
import { Logger } from "./Logger";

export class CompileContext extends Logger {

	static getDefaultWithNullSheet() {
		return new CompileContext(
			compilerOptionDefaults({}),
			SyntaxSheet.getNullSheet()
		)
	}

	private readonly files: Map<string,ParsingFile> = new Map()
	//private fnFiles: Map<string,FnFile> = new Map()

	//public readonly initFn: FnFile
	//public readonly loadFn: FnFile

	//public readonly scoreboards: ScoreboardManager = new ScoreboardManager(this.options)

	constructor(
		options: CompilerOptions,
		public readonly syntaxSheet: SyntaxSheet
	) {
		super(options)
		//this.initFn = this.createFnFile(['std','init'],['Standard initialization'])
		//this.loadFn = this.createFnFile(['std','load'],['Standard load'])
	}
	
	isFileLoaded(path:string) {
		let fullPath = resolve(path)
		return this.files.has(fullPath)
	}

	getLoadedFile(path:string) {
		if (!this.isFileLoaded(path)) throw new Error('Tried getting a non-loaded file')
		let fullPath = resolve(path)
		return this.files.get(fullPath)
	}

	async loadFile(path:string) {
		if (this.isFileLoaded(path)) throw new Error('Tried re-loading a file')
		let f = await ParsingFile.loadFile(path)
		this.files.set(path,f)
		return f
	}

	loadFromSource(source:string,sourceName:string) {
		return ParsingFile.fromSource(source,sourceName)
	}
	
	/*createFnFile(names:string[],headerComments:string[]) {
		let name = this.options.obscureNames ?
			getObscureName(this.fnFiles) :
			getQualifiedName(names,this.fnFiles,Infinity)
		let fn = new FnFile(name,headerComments)
		this.fnFiles.set(name,fn)
		return fn
	}*/

	/*getFnFiles() {
		return [...this.fnFiles.values()]
	}*/

}
