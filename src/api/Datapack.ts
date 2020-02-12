
import { watch } from 'chokidar'
import { promises as fs, Stats }  from 'fs'
import { join } from "path";
import { WeakCompilerOptions, compilerOptionDefaults } from "../toolbox/config";
import { PackJSON, WeakPackJSON, compile, CompileResult } from './Compiler';
import { Logger } from '../toolbox/Logger';
import { loadFileTree } from '../toolbox/FileTree';

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
	
	private status: 'none' | 'fail' | CompileResult = 'none'

	private constructor(
		public readonly packDir: string,
		private packJson: PackJSON
	) {}

	private static async loadPackJson(path:string) {
		return Datapack.getDefaultConfig(JSON.parse((await fs.readFile(path)).toString()))
	}

	static getDefaultConfig(cfg:WeakPackJSON): PackJSON {
		return {
			name: def(cfg.name,'A compiled datapack'),
			description: def(cfg.description,'A description'),
			compilerOptions: compilerOptionDefaults(cfg.compilerOptions),
			srcDir: def(cfg.srcDir,'./'),
			emitDir: def(cfg.emitDir,'./')
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

		const src = await loadFileTree(join(this.packDir,this.packJson.srcDir))

		let cfg = Datapack.getDefaultConfig({
			...this.packJson, // all normal options
			compilerOptions: { // override compileroptions
				...this.packJson.compilerOptions,
				...purgeKeys(cfgOverride) // override non-nullish
			}
		})
		
		const logger = new Logger(cfg.compilerOptions)
		
		logger.logGroup(2,'inf','Overwritten configurations:')
		for (let [key,val] of Object.entries(purgeKeys(cfgOverride)))
			logger.log(2,'inf',`${key} => ${val}`)
		
		try {
			let res = await compile(logger,cfg,src)
			if (res.value) this.status = res.value
			else this.status = 'fail'
		} catch (e) {
			this.status = 'fail'
			throw e
		}

	}

	canEmit() {
		return this.status instanceof CompileResult
	}

	async emit() {
		if (this.status == 'none') throw new Error('Nothing to emit. Use .compile() first.')
		if (this.status == 'fail') throw new Error('Datapack contains errors, cannot emit.')

		let emitDir = join(this.packDir,this.packJson.emitDir)
		await this.status.emit(emitDir)

	}

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
