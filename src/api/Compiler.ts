import { WeakCompilerOptions, CompilerOptions } from "../toolbox/config"
import { join, resolve, dirname } from "path"
import { Datapack } from "./Datapack"
import { CompileContext } from "../toolbox/CompileContext"
import { SyntaxSheet } from "../commands/SyntaxSheet"
import moment = require("moment")
import 'moment-duration-format'
import { lexer } from "../lexing/lexer"
import { fileSyntaxParser } from "../syntax/fileSyntaxParser"
import { PTBody, ParseTreeStore } from "../semantics/ParseTree"
import { CommentInterspercer } from "../toolbox/CommentInterspercer"
import { parseFile } from "../semantics/parseFile"
import { OutputManager } from "../codegen/OutputManager"
import { generate } from "../codegen/generate"
import { promises as fs, Stats } from 'fs'
import { ParsingFile } from "../toolbox/ParsingFile"
import { GenericToken } from "../lexing/Token"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { ModDeclaration, DeclarationType } from "../semantics/Declaration"
import { StdLibrary } from "../stdlib/StdLibrary"
import { MKDIRP, RIMRAF } from "../toolbox/fsHelpers"
import $ from 'js-itertools'
import { instrsToCmds } from "../codegen/Instructions"
import { FnFile } from "../codegen/FnFile"

export class CompileResult {

	constructor(
		private readonly packJson: PackJSON,
		private readonly output: OutputManager
	) {}

	async emit(emitDir:string) {

		// I hate fs right now. Hence the caps.
		await MKDIRP(emitDir+'/data')
		await RIMRAF(emitDir+'/data/*')

		await fs.writeFile(emitDir+'/pack.mcmeta',JSON.stringify({
			pack: {
				description: this.packJson.description
			}
		},null,2))
		let ns = emitDir+'/data/tmp'
		await fs.mkdir(ns)
		let fns = ns + '/functions'
		await fs.mkdir(fns)
		await Promise.all(
			$(this.output.functions.all()).map(
				([name,fnf]) => fs.writeFile(
					fns+'/'+name+'.mcfunction',
					instrsToCmds(
						fnf.mergeBuffers(),
						fnf.getHeader(),
						(fnf:FnFile)=>{
							let res = this.output.functions.getName(fnf)
							if (!res) throw new Error('tried calling non-existant function file')
							return 'tmp:'+res
						}
					).join('\n')
				)
			)
		)
		ns = emitDir+'/data/minecraft'
		await fs.mkdir(ns)
		await fs.mkdir(ns+'/tags')
		await fs.mkdir(ns+'/tags/functions')
		await fs.writeFile(ns+'/tags/functions/tick.json',JSON.stringify({
			values: []
		}))
		/*await fs.writeFile(ns+'/tags/functions/load.json',JSON.stringify({
			values: ['tmp:'+this.ctx.loadFn.name]
		}))*/
	}

}

export interface WeakPackJSON {
	name?: string
	description?: string
	srcDir?: string
	emitDir?: string
	compilerOptions?: WeakCompilerOptions
}

export interface PackJSON extends Required<WeakPackJSON> {
	compilerOptions: CompilerOptions
}

export async function compile(cfg:PackJSON,srcFiles:string[]): Promise<CompileResult> {

	const ctx = new CompileContext(
		cfg.compilerOptions,
		await SyntaxSheet.load(cfg.compilerOptions.targetVersion)
	)
	
	ctx.log2(1,'inf',`Begin compilation`)
	let start = moment()

	const pfiles = await Promise.all(
		srcFiles
			.sort() // ensure same load order every run
			.map(srcFile=>ctx.loadFile(srcFile))
	)
	
	ctx.log2(1,'inf',`Loaded ${srcFiles.length} file(s)`)
	
	pfiles.forEach(pf=>lexer(pf,ctx))
	ctx.log2(1,'inf',`Lexical analysis complete`)

	pfiles.forEach(pf=>fileSyntaxParser(pf,ctx))
	ctx.log2(1,'inf',`Syntax analysis complete`)

	const store = new ParseTreeStore()
	const fetcher = createFetcher(pfiles,ctx,store)
	let gotErrors = false

	pfiles.forEach(pf=>{
		let res = parseFile(pf,ctx,fetcher,store)
		if (!res.value) gotErrors = true
	})
	if (!gotErrors)
		ctx.log2(1,'inf',`Semantical analysis complete`)
	else
		ctx.log2(1,'err',`Semantical analysis failed`)

	const output = new OutputManager(cfg.compilerOptions)
	if (!gotErrors) {

		generate(store,output)
		ctx.log2(1,'inf',`Generation complete`)

		ctx.log2(0,'wrn',`No verifier function yet`)
		ctx.log2(1,'inf',`Verification complete`)

		ctx.log2(1,'inf',`Compilation complete`)
		ctx.log2(2,'inf',`Elapsed time: ${(moment.duration(moment().diff(start)) as any).format()}`)

	}

	if (ctx.hasErrors()) {
		ctx.logErrors()
		ctx.log2(1,'err',`Raised ${ctx.getErrorCount()} error${ctx.getErrorCount()>1?'s':''}`)
	}

	if (ctx.hasWarnings()) {
		ctx.logWarns()
		ctx.log2(1,'wrn',`Raised ${ctx.getWarningCount()} warning${ctx.getWarningCount()>1?'s':''}`)
	}

	if (ctx.hasErrors()) throw new Error(`${ctx.getErrorCount()} error(s) raised.`)

	if (ctx.hasErrors()||gotErrors)
		throw new Error('Failed to compile')

	return new CompileResult(cfg,output)

}

function def<T>(val:T|undefined,def:T): T {return val == undefined ? def : val}

function purgeKeys<T>(obj:T): T {
	obj = {...obj}
	for (let key in obj)
		if ([null,undefined].includes(obj[key] as any)) delete obj[key]
	return obj
}

async function recursiveSearch(path:string): Promise<string[]> {
	let files = await fs.readdir(path)
	let stats = await Promise.all(files.map(f=>fs.stat(join(path,f))))
	let dirs = stats
		.map((d,i)=>([d,i] as [Stats,number]))
		.filter(([s])=>s.isDirectory())
		.map(([_,i])=>files[i])
	return files
		.filter(f=>!dirs.includes(f))
		.map(f=>join(path,f))
		.concat(
			(await Promise.all(dirs.map(d=>recursiveSearch(join(path,d)))))
				.reduce((a,c)=>a.concat(c),[])
				.map(v=>v)
		)
}

export type Fetcher = (origin:ParsingFile,token:GenericToken) => Maybe<ModDeclaration>

function createFetcher(pfiles:ParsingFile[],ctx:CompileContext,store:ParseTreeStore): Fetcher {
	const stdLib = StdLibrary.create(ctx)
	return fetcher
	function fetcher(origin:ParsingFile,token:GenericToken): Maybe<ModDeclaration> {
		const maybe = new MaybeWrapper<ModDeclaration>()
		let src = token.value.slice(1,-1)
		// relative file import
		if (src.startsWith('.')) {
			let path = resolve(dirname(origin.fullPath),src+'.dpl')
			let pf = pfiles.find(p=>p.fullPath == path)
			if (pf instanceof ParsingFile) {
				if (!parseFile(pf,ctx,fetcher,store).value) {
					ctx.addError(token.error('file has errors'))
					return maybe.none()
				}
				return maybe.wrap(pf.module)
			} else {
				ctx.addError(token.error('could not find source file'))
				maybe.noWrap()
			}
		}
		// std library import
		let decl = stdLib.getDeclaration(token,ctx)
		if (!decl.value) {
			ctx.addError(token.error('could not find library'))
			return maybe.none()
		}
		if (decl.value.decl.type != DeclarationType.MODULE) {
			ctx.addError(token.error('not a module'))
			return maybe.none()
		}
		return maybe.wrap(decl.value.decl)
	}		

}
