
import { CompilerOptions, compilerOptionDefaults } from "./config";
import { SyntaxSheet } from "../commands/SyntaxSheet";
import { ScoreboardManager } from "./ScoreboardManager";
import { ParsingFile } from "../lexing/ParsingFile";
import { resolve, relative, basename } from "path";
import { readFileSync } from "fs";
import { Scope } from "../semantics/Scope";
import { FnFile } from "../codegen/FnFile";
import { getObscureName, getQualifiedName } from "./other";
import cols from 'colors/safe'
import { CompileError, CompileErrorSet } from "./CompileErrors";

export class CompileContext {

	static getDefaultWithNullSheet() {
		return new CompileContext(
			compilerOptionDefaults({}),
			SyntaxSheet.getNullSheet()
		)
	}

	private readonly files: Map<string,ParsingFile> = new Map()
	private fnFiles: Map<string,FnFile> = new Map()

	public readonly scoreboards: ScoreboardManager = new ScoreboardManager(this.options)

	constructor(
		public readonly options: CompilerOptions,
		public readonly syntaxSheet: SyntaxSheet
	) {}
	
	isFileLoaded(path:string) {
		let fullPath = resolve(path)
		return this.files.has(fullPath)
	}

	getLoadedFile(path:string) {
		if (!this.isFileLoaded(path)) throw new Error('Tried getting a non-loaded file')
		let fullPath = resolve(path)
		return this.files.get(fullPath)
	}

	loadFile(path:string) {
		if (this.isFileLoaded(path)) throw new Error('Tried re-loading a file')
		return ParsingFile.loadFile(path,this)
	}

	loadFromSource(source:string) {
		return ParsingFile.fromSource(source,this)
	}
	
	createFnFile(names:string[]) {
		let name = this.options.obscureNames ?
			getObscureName(this.fnFiles) :
			getQualifiedName(names,this.fnFiles,Infinity)
		let fn = new FnFile(name)
		this.fnFiles.set(name,fn)
		return fn
	}

	getFnFiles() {
		return [...this.fnFiles.values()]
	}

	private lastLogLevel = 0
	log(level:number,msg:string) {
		if (level > this.options.verbosity) return 
		if (this.lastLogLevel > level) console.log()
		let pad = ''
		if (level > 1) pad = ' '.repeat(2 * level - 3) + '- '
		console.log(pad + msg)
		this.lastLogLevel = level
	}

	logErrors(errors:CompileErrorSet) {
		for (let err of errors.getErrors()) {
			this.lastLogType = null
			this.log2(0,'err',err.getErrorString())
		}
		this.lastLogType = null
	}

	private lastLogType: LogType|null = null
	// private lastLogLevel2 = 0
	log2(level:number,type:LogType,msg:string) {
		if (level > this.options.verbosity) return
		let col = type == 'inf' ? cols.green : type == 'wrn' ? cols.yellow : cols.red
		if (!this.options.colorLog) col = (s:string) => s

		let pad = col('    ] ')
		let padh = col(`\n[${type}] `)
		console.log(
			msg
				.split('\n')
				.map((s,i) =>
					col(
						i==0 && this.lastLogType != type ? padh : pad
					) + s
				)
				.join('\n')
		)

		// this.lastLogLevel2 = level
		this.lastLogType = type

	}

}

type LogType = 'inf' | 'err' | 'wrn'
