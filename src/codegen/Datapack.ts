
import { watch } from 'chokidar'
import { FnFile } from "./FnFile";
import { promises as fs, constants, Stats, mkdir }  from 'fs'
import { exec } from 'child_process'
import { resolve as resolvePath, join } from "path";
import { lexer as lexicalAnalysis } from "../lexing/lexer";
//import { generateCode } from "./generate";
import { fileSyntaxParser } from "../syntax/fileSyntaxParser";
import { WeakCompilerOptions, CompilerOptions, compilerOptionDefaults } from "../toolbox/config";
import { semanticsParser } from "../semantics/semanticsParser";
import { ParsingFile } from "../lexing/ParsingFile";
import { CompileContext } from "../toolbox/CompileContext";
import { SyntaxSheet } from "../commands/SyntaxSheet";
import { optimize } from "../optimization/instructionOptimizer";
import moment from "moment"
import 'moment-duration-format'
import { Instruction } from "./Instructions";
import { getObscureName, getQualifiedName } from "../toolbox/other";
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
			compilerOptions: merge( // override compileroptions:
				cfgOverride, // override options
				this.packJson.compilerOptions // use normal if nullish on override
			)
		})

		const ctx = this.ctx = new CompileContext(
			cfg.compilerOptions,
			await SyntaxSheet.load(cfg.compilerOptions.targetVersion)
		)

		let err = new CompileErrorSet()
		let errCount = 0

		ctx.log2(1,'inf',`Begin compilation`)
		let start = moment()

		const pfiles =
			srcFiles
			.sort() // ensure same load order every run
			.map(srcFile=>ctx.loadFile(srcFile))
		ctx.log2(1,'inf',`Loaded ${srcFiles.length} file(s)`)
		
		pfiles.forEach(pf=>lexicalAnalysis(pf,ctx))
		ctx.log2(1,'inf',`Lexical analysis complete`)

		pfiles.forEach(pf=>fileSyntaxParser(pf,ctx))
		ctx.log2(1,'inf',`Syntax analysis complete`)

		errCount = err.getCount()
		pfiles.forEach(pf=>err.checkHasValue(semanticsParser(pf,ctx)))
		ctx.log2(1,'inf',`Semantic analysis complete`)
		if (errCount < err.getCount()) {
			ctx.log2(1,'err',`Got ${err.getCount()-errCount} error(s)`)
			errCount = err.getCount()
		}


		let optres = optimize(ctx)
		ctx.log2(1,'inf',`Optimization complete`)
		ctx.log2(2,'inf',`Successful passes: ${optres.meta.passes}`)

		this.fnMap = new Map(
			ctx.getFnFiles()
				.map(fn=>[fn.name,generate(fn)])
		)
		ctx.log2(1,'inf',`Generation complete`)

		ctx.log2(0,'wrn',`No verifier function yet`)
		ctx.log2(1,'inf',`Verification complete`)

		ctx.log2(1,'inf',`Compilation complete`)
		ctx.log2(2,'inf',`Elapsed time: ${(moment.duration(moment().diff(start)) as any).format()}`)

		if (!err.isEmpty()) {
			ctx.log2(1,'err',`Found a total of ${err.getCount()} errors:`)
			ctx.logErrors(err)	
		}

	}

	async emit() {
		if (!this.fnMap || !this.ctx) throw new Error('Nothing to emit. Use .compile() first.')
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
		await fs.writeFile(fns+'/tick.mcfunction',''/*this.tickFile.join('\n')*/)
		await fs.writeFile(fns+'/load.mcfunction',''/*this.loadFile.join('\n')*/)
		await fs.writeFile(fns+'/init.mcfunction',''/*this.loadFile.join('\n')*/)
		ns = emitDir+'/data/minecraft'
		await fs.mkdir(ns)
		await fs.mkdir(ns+'/tags')
		await fs.mkdir(ns+'/tags/functions')
		await fs.writeFile(ns+'/tags/functions/tick.json',JSON.stringify({
			values: ['tmp/tick']
		}))
		await fs.writeFile(ns+'/tags/functions/load.json',JSON.stringify({
			values: ['tmp/load']
		}))
	}

}

function def<T>(val:T|undefined,def:T): T {return val == undefined ? def : val}

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
import { CompileErrorSet } from '../toolbox/CompileErrors';
function RIMRAF(path:string) {
	return new Promise(($,$r)=>{
		rimraf(path,{},err=>{
			if (err) $r(err)
			else $()
		})
	})
}
