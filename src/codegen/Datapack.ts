
import { FnFile } from "./FnFile";
import { promises as fs, Stats}  from 'fs'
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
import { Instruction } from "../semantics/Instructions";

interface WeakPackJSON {
	name?: string
	description?: string
	debugMode?: boolean
	compilerOptions?: WeakCompilerOptions
}

interface PackJSON extends Required<WeakPackJSON> {
	compilerOptions: CompilerOptions
}

export class Datapack {

	private init: Instruction[] = []

	private files: FnFile[] = []

	constructor(
		public readonly srcDir: string,
		public readonly emitDir: string = srcDir
	) {
		this.addInit(
			// `tellraw @a Loaded my first compiled datapack!`,
			//`scoreboard objectives add ${this.publicVariableScoreboard} dummy`
		)
	}

	addInit(...instrs:Instruction[]) {this.init.push(...instrs)}

	addFnFile(f:FnFile) {this.files.push(f)}

	async compile() {

		const files = await recursiveSearch(this.srcDir)
		const packJson = join(this.srcDir,'pack.json')
		let cfg: PackJSON
		if (!files.includes(packJson)) cfg = this.configDefaults({})
		else cfg = this.configDefaults(JSON.parse((await fs.readFile(packJson)).toString()))

		const srcFiles = files.filter(f=>f.endsWith('.txt'))

		const ctx = new CompileContext(
			cfg.compilerOptions,
			await SyntaxSheet.load(cfg.compilerOptions.targetVersion)
		)

		ctx.log(1,`Begin compilation`)
		let start = moment()

		const pfiles =
			srcFiles
			.sort() // ensure same load order every run
			.map(ParsingFile.loadFile)
		ctx.log(1,`Loaded ${srcFiles.length} file(s)`)
		
		pfiles.forEach(pf=>lexicalAnalysis(pf,ctx))
		ctx.log(1,`Lexical analysis complete`)

		pfiles.forEach(pf=>fileSyntaxParser(pf,ctx))
		ctx.log(1,`Syntax analysis complete`)

		pfiles.forEach(pf=>semanticsParser(pf,ctx))
		ctx.log(1,`Semantic analysis complete`)

		let optres = optimize(this,ctx)
		ctx.log(1,`Optimization complete`)
		ctx.log(2,`Sucessful passes: ${optres.meta.passes}`)

		// throw new Error('no generator')
		//pfiles.forEach(pf=>generateCode(pf,this))

		ctx.log(1,`Compilation complete`)
		ctx.log(2,`Elapsed time: ${(moment.duration(moment().diff(start)) as any).format()}`)

		throw new Error('not yet boi')

	}

	async emit() {
		let delPath = resolvePath(this.emitDir+'/data')
		let cmd = 'rmdir /Q /S ' + delPath
		await execp(cmd) // this is vulnerable to shell code injection
		await fs.mkdir(this.emitDir)
		await fs.writeFile(this.emitDir+'/pack.mcmeta',JSON.stringify({
			pack: {
				description: 'hello' //this.config.description
			}
		}))
		await fs.mkdir(this.emitDir+'/data')
		let ns = this.emitDir+'/data/tmp'
		await fs.mkdir(ns)
		let fns = ns + '/functions'
		await fs.mkdir(fns)
		await Promise.all(
			this.files.map(f=>fs.writeFile(fns+'/'+f.name+'.mcfunction',f.getCode().join('\n')))
		)
		// await fs.writeFile(fns+'/tick',this.tickFile.join('\n'))
		// await fs.writeFile(fns+'/load',this.loadFile.join('\n'))
		ns = this.emitDir+'/data/minecraft'
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

	private configDefaults(cfg:WeakPackJSON): PackJSON {
		return {
			name: def(cfg.name,'A compiled datapack'),
			description: def(cfg.description,'A description'),
			compilerOptions: compilerOptionDefaults(cfg.compilerOptions),
			debugMode: def(cfg.debugMode,false)
		}
	}

}

function def<T>(val:T|undefined,def:T): T {return val == undefined ? def : val}

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
