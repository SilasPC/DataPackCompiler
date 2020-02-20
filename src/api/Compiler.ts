import { resolve, dirname, join } from "path"
import { CompileContext } from "../toolbox/CompileContext"
import { SyntaxSheet } from "../commands/SyntaxSheet"
import moment = require("moment")
import 'moment-duration-format'
import { lexer } from "../lexing/lexer"
import { fileSyntaxParser } from "../syntax/fileSyntaxParser"
import { OutputManager } from "../codegen/managers/OutputManager"
import { generate } from "../codegen/generate"
import { promises as fs, Stats } from 'fs'
import { MKDIRP, RIMRAF } from "../toolbox/fsHelpers"
import $ from 'js-itertools'
import { instrsToCmds } from "../codegen/Instructions"
import { Logger } from "../toolbox/Logger"
import { ProgramManager } from "../semantics/managers/ProgramManager"
import { parseInputTree } from "../semantics/parseModuleTree"
import { Config } from "./Configuration"
import { InputTree } from "../input/InputTree"
import { Result, ResultWrapper } from "../toolbox/Result"
import { DataCache } from "../toolbox/Cache"
import { addConvention } from "../codegen/generateConvention"

export const compilerVersion = '0.1.0'

export function checkVersionFormat(ver:string) {
	return ver
		.split('.')
		.map(n=>parseInt(n,10))
		.every(n=>Number.isInteger(n) && n >= 0)
}

export function checkVersion(ver:string,min:string) {
	let vers = ver.split('.').map(n=>parseInt(n,10)), mins = min.split('.').map(n=>parseInt(n,10))
	for (let i = 0; i < mins.length; i++)
		if (mins[i] > vers[i]) return false
	return true
}

export class CompileResult {

	constructor(
		private readonly cache: DataCache,
		private readonly cfg: Config,
		private readonly output: OutputManager
	) {}

	async emit(emitDir:string,log:Logger) {

		log.logGroup(2,'inf','Emitting')

		// I hate fs right now. Hence the caps.
		await MKDIRP(emitDir+'/data')
		await RIMRAF(emitDir+'/data/*')

		await fs.writeFile(emitDir+'/pack.mcmeta',JSON.stringify({
			pack: {
				pack_format: 1,
				description: this.cfg.pack.description
			}
		},null,2))
		const dataNs = join(emitDir,'data')
		const ns = emitDir+'/data/'+this.cfg.pack.namespace
		await fs.mkdir(ns)
		let fns = ns + '/functions'
		await fs.mkdir(fns)
		await Promise.all(
			$(this.output.functions.all()).map(
				([name,fnf]) => fs.writeFile(
					fns+'/'+name+'.mcfunction',
					instrsToCmds(
						this.cfg,
						this.output,
						this.cfg.compilation.debugBuild,
						fnf.mergeBuffers(this.output.functions),
						fnf.getHeader()
					).join('\n')
				)
			)
		)
		const mcFnTags = join(emitDir,'data/minecraft/tags/functions')
		await MKDIRP(mcFnTags)
		await fs.writeFile(join(mcFnTags,'tick.json'),JSON.stringify({
			values: [...this.output.tags.tick].map(fnf=>fnf.mcPath)
		}))
		await fs.writeFile(join(mcFnTags,'load.json'),JSON.stringify({
			values: [...this.output.tags.load].map(fnf=>fnf.mcPath)
		}))

		log.log(2,'inf','Success')

	}

}

export async function compile(cache: DataCache, logger:Logger,cfg:Config,src:InputTree,sheet:SyntaxSheet): Promise<CompileResult | null> {

	const result = new ResultWrapper<CompileResult,null>()

	const ctx = new CompileContext(
		logger,
		cfg.compilation,
		sheet
	)

	if (!checkVersion(compilerVersion,ctx.options.minimumVersion)) {
		logger.log(0,'err',`Pack requires compiler version ${ctx.options.minimumVersion}, currently installed: ${compilerVersion}`)
		return null
	}
	
	logger.logGroup(1,'inf',`Begin compilation`)
	let start = moment()

	const modules = src.allModules()
	
	const programManager = new ProgramManager()
	
	logger.log(1,'inf',`Loaded ${src.countAll()} file(s)`)
	
	modules.forEach(mod=>lexer(mod))
	logger.log(1,'inf',`Lexical analysis complete`)

	let gotSyntaxErrors = false
	modules.forEach(mod=>{
		let res = fileSyntaxParser(mod,ctx)
		if (result.mergeCheck(res)) gotSyntaxErrors = true
	})
	if (!gotSyntaxErrors)
		logger.log(1,'inf',`Syntax analysis complete`)
	else {
		logger.log(1,'err',`Syntax analysis failed`)
		logger.raiseErrors(result)
		return null
	}

	let gotSemanticalErrors = false

	if (result.mergeCheck(parseInputTree(src,programManager,ctx)))
		gotSemanticalErrors = true

	if (result.mergeCheck(programManager.hoisting.flushDefered()))
		gotSemanticalErrors = true

	/*for (let h of programManager.getUnreferenced()) {
		logger.addError(h.getToken().warning('Never referenced'))
	}*/

	if (result.mergeCheck(programManager.hoisting.flushAll()))
		gotSemanticalErrors = true

	if (!gotSemanticalErrors)
		logger.log(1,'inf',`Semantical analysis complete`)
	else
		logger.log(1,'err',`Semantical analysis failed`)

	const output = new OutputManager(cfg)
	if (!gotSemanticalErrors) {

		await addConvention(cache,cfg,output.misc)
		generate(programManager,output)
		logger.log(1,'inf',`Generation complete`)

		logger.log(0,'wrn',`No verifier function yet`)
		logger.log(1,'inf',`Verification complete`)

		logger.log(1,'inf',`Compilation complete`)
		logger.log(2,'inf',`Elapsed time: ${(moment.duration(moment().diff(start)) as any).format()}`)

	} else {
	    logger.raiseErrors(result)
        return null
    }
	
	return new CompileResult(cache,cfg,output)

}
