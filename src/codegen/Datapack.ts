
import { watch } from 'chokidar'
import { promises as fs, Stats }  from 'fs'
import { exec } from 'child_process'
import { join, resolve, relative, dirname } from "path";
import { lexer as lexicalAnalysis } from "../lexing/lexer";
import { fileSyntaxParser } from "../syntax/fileSyntaxParser";
import { WeakCompilerOptions, CompilerOptions, compilerOptionDefaults } from "../toolbox/config";
import { semanticsParser } from "../semantics/semanticsParser";
import { CompileContext } from "../toolbox/CompileContext";
import { SyntaxSheet } from "../commands/SyntaxSheet";
import { optimize } from "../optimization/instructionOptimizer";
import moment from "moment"
import 'moment-duration-format'
import { generate } from "./generate";

interface WeakPackJSON {
	name?: string
	description?: string
	debugMode?: boolean
	srcDir?: string
	emitDir?: string
	compilerOptions?: WeakCompilerOptions
}

interface PackJSON extends Required<WeakPackJSON> {
	compilerOptions: CompilerOptions
}

export class Datapack {

	static async initialize(path:string) {
		await fs.writeFile(join(path,'pack.json'),JSON.stringify(
			Datapack.getDefaultConfig({}),
			null,
			2
		))
	}

	static async load(path:string) {
		return new Datapack(
			path,
			await Datapack.loadPackJson(join(path,'pack.json'))
		)
	}
	
	private ctx: CompileContext | null = null
	private errorIgnoreEmit = false
	private fnMap: Map<string,string[]> | null = null;

	private constructor(
		public readonly packDir: string,
		private packJson: PackJSON
	) {}

	private static async loadPackJson(path:string) {
		let weakPack: WeakPackJSON = JSON.parse((await fs.readFile(path)).toString())
		// if (!weakPack.compilerOptions) weakPack.compilerOptions = {}
		// merge(weakPack.compilerOptions,cfgOverride)
		return Datapack.getDefaultConfig(weakPack)
	}

	static getDefaultConfig(cfg:WeakPackJSON): PackJSON {
		return {
			name: def(cfg.name,'A compiled datapack'),
			description: def(cfg.description,'A description'),
			compilerOptions: compilerOptionDefaults(cfg.compilerOptions),
			srcDir: def(cfg.srcDir,'./'),
			emitDir: def(cfg.emitDir,'./'),
			debugMode: def(cfg.debugMode,false)
		}
	}

	watchSourceDir(h:()=>void) {
		const watcher = watch(join(this.packDir,this.packJson.srcDir), {})
		watcher.once('ready',()=>{
			watcher.on('all',(_e,f)=>{
				if (f.endsWith('.dpl'))	h()
			})
		})
		return watcher
	}

	async compile(cfgOverride:WeakCompilerOptions={}) {

		const files = await recursiveSearch(join(this.packDir,this.packJson.srcDir))		

		const srcFiles = files.filter(f=>f.endsWith('.dpl'))

		let cfg = Datapack.getDefaultConfig({
			...this.packJson, // all normal options
			compilerOptions: { // override compileroptions:
				...this.packJson.compilerOptions, // use normal if nullish on override
				...purgeKeys(cfgOverride) // override options
			}
		})

		const ctx = this.ctx = new CompileContext(
			cfg.compilerOptions,
			await SyntaxSheet.load(cfg.compilerOptions.targetVersion)
		)
		
		ctx.log2(2,'inf','Overwritten configurations:')
		for (let [key,val] of Object.entries(purgeKeys(cfgOverride)))
			ctx.log2(2,'inf',`${key} => ${val}`)

		ctx.log2(1,'inf',`Begin compilation`)
		let start = moment()

		let errCount = 0

		const pfiles = await Promise.all(
			srcFiles
				.sort() // ensure same load order every run
				.map(srcFile=>ctx.loadFile(srcFile))
		)
		
		ctx.log2(1,'inf',`Loaded ${srcFiles.length} file(s)`)
		
		pfiles.forEach(pf=>lexicalAnalysis(pf,ctx))
		ctx.log2(1,'inf',`Lexical analysis complete`)

		pfiles.forEach(pf=>fileSyntaxParser(pf,ctx))
		ctx.log2(1,'inf',`Syntax analysis complete`)

		pfiles.forEach(pf=>semanticsParser(pf,ctx,createFetcher(pfiles,ctx)))
		ctx.log2(1,'inf',`Semantic analysis complete`)
		if (errCount < ctx.getErrorCount()) {
			ctx.log2(1,'err',`Got ${ctx.getErrorCount()-errCount} error(s)`)
			errCount = ctx.getErrorCount()
		}

		if (ctx.options.optimize) {
			let optres = optimize(ctx)
			ctx.log2(1,'inf',`Optimization complete`)
			ctx.log2(2,'inf',`Successful passes: ${optres.meta.passes}`)
		}

		this.fnMap = new Map(
			ctx.getFnFiles()
				.flatMap(fn=>fn.isDead()?[]:[[fn.name,generate(fn)]])
		)
		ctx.log2(1,'inf',`Generation complete`)

		ctx.log2(0,'wrn',`No verifier function yet`)
		ctx.log2(1,'inf',`Verification complete`)

		ctx.log2(1,'inf',`Compilation complete`)
		ctx.log2(2,'inf',`Elapsed time: ${(moment.duration(moment().diff(start)) as any).format()}`)

		if (ctx.hasErrors()) {
			this.errorIgnoreEmit = true
			ctx.logErrors()
			ctx.log2(1,'err',`Raised ${ctx.getErrorCount()} error${ctx.getErrorCount()>1?'s':''}`)
		} else this.errorIgnoreEmit = false

		if (ctx.hasWarnings()) {
			ctx.logWarns()
			ctx.log2(1,'wrn',`Raised ${ctx.getWarningCount()} warning${ctx.getWarningCount()>1?'s':''}`)
		}

	}

	canEmit() {
		return Boolean(this.fnMap && this.ctx && !this.errorIgnoreEmit)
	}

	async emit() {
		if (!this.fnMap || !this.ctx) throw new Error('Nothing to emit. Use .compile() first.')
		if (this.errorIgnoreEmit) throw new Error('Datapack contains errors, cannot emit.')

		let emitDir = join(this.packDir,this.packJson.emitDir)

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
			[...this.fnMap.entries()].map(([fn,code])=>fs.writeFile(fns+'/'+fn+'.mcfunction',code.join('\n')))
		)
		ns = emitDir+'/data/minecraft'
		await fs.mkdir(ns)
		await fs.mkdir(ns+'/tags')
		await fs.mkdir(ns+'/tags/functions')
		await fs.writeFile(ns+'/tags/functions/tick.json',JSON.stringify({
			values: []
		}))
		await fs.writeFile(ns+'/tags/functions/load.json',JSON.stringify({
			values: ['tmp:'+this.ctx.loadFn.name]
		}))
	}

}

function def<T>(val:T|undefined,def:T): T {return val == undefined ? def : val}

function purgeKeys<T>(obj:T): T {
	obj = {...obj}
	for (let key in obj)
		if ([null,undefined].includes(obj[key] as any)) delete obj[key]
	return obj
} 

function merge<T>(target:T,source:T): T {
	let obj = {...target}
	for (let key in obj)
		if ([null,undefined].includes(obj[key] as any)) obj[key] = source[key]
	return obj
}

function execp(cmd:string) {
	return new Promise((resolve,reject)=>{
		exec(cmd,(err=>{
			if (err) reject(err)
			else resolve()
		}))
	})
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

import mkdirp from 'mkdirp'
function MKDIRP(path:string) {
	return new Promise(($,$r)=>{
		mkdirp(path,err=>{
			if (err) $r(err)
			else $()
		})
	})
}

import rimraf from 'rimraf'
import { Maybe, MaybeWrapper } from '../toolbox/Maybe';
import { ParsingFile } from '../toolbox/ParsingFile';
import { GenericToken } from '../lexing/Token';
import { StdLibrary } from '../stdlib/StdLibrary';
import { ModDeclaration, DeclarationType } from '../semantics/Declaration';
import { SymbolTable } from '../semantics/SymbolTable';
function RIMRAF(path:string) {
	return new Promise(($,$r)=>{
		rimraf(path,{},err=>{
			if (err) $r(err)
			else $()
		})
	})
}

export type Fetcher = (origin:ParsingFile,token:GenericToken) => Maybe<ModDeclaration>

function createFetcher(pfiles:ParsingFile[],ctx:CompileContext): Fetcher {
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
				//if (pf.status != 'parsing') {
					if (!semanticsParser(pf,ctx,fetcher).value) {
						ctx.addError(token.error('file has errors'))
						return maybe.none()
					}
					return maybe.wrap(pf.asModule())
				//} else {
				//	ctx.addError(token.error('circular dependency'))
				//	return maybe.none()
				//}
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
