
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

	public config: PackJSON|null = null

	private tickFile: string[] = []
	private loadFile: string[] = []

	//public readonly publicVariableScoreboard = generateIdentifier()
	private files: FnFile[] = []

	constructor(
		public readonly name: string,
		public readonly srcDir: string,
		public readonly emitDir: string
	) {
		this.addLoadCode(
			`tellraw @a Loaded my first compiled datapack!`,
			//`scoreboard objectives add ${this.publicVariableScoreboard} dummy`
		)
	}

	addLoadCode(...lines:string[]) {this.loadFile.push(...lines)}
	addTickCode(...lines:string[]) {this.tickFile.push(...lines)}

	addFnFile(f:FnFile) {this.files.push(f)}

	async compile() {

		const files = await recursiveSearch(this.srcDir)
		let packJson = join(this.srcDir,'pack.json')
		if (!files.includes(packJson)) throw new Error('pack.json not found')
		this.setConfigDefaults(JSON.parse((await fs.readFile(packJson)).toString()))

		let pfiles = files
			.filter(f=>f.endsWith('.txt'))
			.sort()
			.map(ParsingFile.loadFile)
		pfiles.forEach(lexicalAnalysis)
		pfiles.forEach(fileSyntaxParser)
		pfiles.forEach(semanticsParser)
		throw new Error('no generator')
		//pfiles.forEach(pf=>generateCode(pf,this))

	}

	async emit() {
		if (this.config == null) throw new Error('Config not set')
		let delPath = resolvePath(this.emitDir)
		let cmd = 'rmdir /Q /S '+delPath
		await execp(cmd) // this is vulnerable to shell code injection
		await fs.mkdir(this.emitDir)
		await fs.writeFile(this.emitDir+'/pack.mcmeta',JSON.stringify({
			pack: {
				description: this.config.description
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
		await fs.writeFile(fns+'/tick',this.tickFile.join('\n'))
		await fs.writeFile(fns+'/load',this.loadFile.join('\n'))
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

	private setConfigDefaults(cfg:WeakPackJSON) {
		this.config = {
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
