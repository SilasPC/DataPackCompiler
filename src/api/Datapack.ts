
import { watch } from 'chokidar'
import { promises as fs, Stats }  from 'fs'
import { join } from "path";
import { WeakCompilerOptions } from "../toolbox/config";
import { compile, CompileResult } from './Compiler';
import { Logger } from '../toolbox/Logger';
import { loadFileTree } from '../toolbox/FileTree';
import { Config } from './Configuration';
import { purgeNullishKeys } from '../toolbox/other';

export class Datapack {

	static async initialize(path:string) {
		await Config.writeDefaultToTOMLFile(join(path,'pack.toml'))
	}

	static async load(path:string) {
		return new Datapack(
			path,
			await Config.fromTOMLFile(join(path,'pack.toml'))
		)
	}
	
	private log: Logger | null = null
	private status: 'none' | 'fail' | CompileResult = 'none'

	private constructor(
		public readonly packDir: string,
		private readonly cfg: Config
	) {}

	watchSourceDir(h:()=>void) {
		const watcher = watch(join(this.packDir,this.cfg.compilation.sourceDir), {})
		watcher.once('ready',()=>{
			watcher.on('all',(_e,f)=>{
				if (f.endsWith('.dpl'))	h()
			})
		})
		return watcher
	}

	async compile(cfgOverride:WeakCompilerOptions={}) {

		const src = await loadFileTree(join(this.packDir,this.cfg.compilation.sourceDir))

		let cfg = this.cfg.overrideCompilerOptions(purgeNullishKeys(cfgOverride))
		
		const logger = new Logger(cfg.compilation)
		this.log = logger
		
		logger.logGroup(2,'inf','Overwritten configurations:')
		for (let [key,val] of Object.entries(purgeNullishKeys<WeakCompilerOptions,any>(cfgOverride)))
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

	canEmit() {return this.status instanceof CompileResult}

	async emit() {
		if (this.status == 'none') throw new Error('Nothing to emit. Use .compile() first.')
		if (this.status == 'fail') throw new Error('Datapack contains errors, cannot emit.')

		if (!this.log) throw new Error('should not happen')

		let emitDir = join(this.packDir,this.cfg.compilation.emitDir,this.cfg.pack.name)
		await this.status.emit(emitDir,this.log)

		this.log.logGroup(2,'inf','Success')
	}

}
