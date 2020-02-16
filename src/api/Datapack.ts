
import { watch } from 'chokidar'
import { promises as fs, Stats }  from 'fs'
import { join } from "path";
import { WeakCompilerOptions } from "../toolbox/config";
import { compile, CompileResult } from './Compiler';
import { Logger } from '../toolbox/Logger';
import { Config } from './Configuration';
import { purgeNullishKeys } from '../toolbox/other';
import { loadDirectory } from '../input/loadFromFileSystem';
import { SyntaxSheet } from '../commands/SyntaxSheet';
import { ResultWrapper } from '../toolbox/Result';

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

		const result = new ResultWrapper()

		let cfg = this.cfg.overrideCompilerOptions(purgeNullishKeys(cfgOverride))
		
		const logger = new Logger(cfg.compilation)
		this.log = logger

		const srcRes = await loadDirectory(this.packDir,join(this.packDir,this.cfg.compilation.sourceDir))

		let src = srcRes.getEnsured()

		logger.logGroup(2,'inf','Overwritten configurations:')
		for (let [key,val] of Object.entries(purgeNullishKeys<WeakCompilerOptions,any>(cfgOverride)))
			logger.log(2,'inf',`${key} => ${val}`)

		logger.logGroup(3,'inf','File structure:')
		logger.log(3,'inf',src.getStructureString())
		
		try {
			let sheet = await SyntaxSheet.load(cfg.compilation.targetVersion)
			let res = await compile(logger,cfg,src,sheet)
			if (!result.merge(res)) this.status = res.getValue()
			else {
				this.status = 'fail'
			}
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
	}

}
