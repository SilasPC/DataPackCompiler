import { WeakCompilerOptions, CompilerOptions } from "../toolbox/config"
import { resolve, dirname } from "path"
import { CompileContext } from "../toolbox/CompileContext"
import { SyntaxSheet } from "../commands/SyntaxSheet"
import moment = require("moment")
import 'moment-duration-format'
import { lexer } from "../lexing/lexer"
import { fileSyntaxParser } from "../syntax/fileSyntaxParser"
import { ParseTreeStore } from "../semantics/ParseTree"
import { OutputManager } from "../codegen/OutputManager"
import { generate } from "../codegen/generate"
import { promises as fs, Stats } from 'fs'
import { ParsingFile } from "../toolbox/ParsingFile"
import { GenericToken } from "../lexing/Token"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { ModDeclaration, DeclarationType } from "../semantics/declarations/Declaration"
import { StdLibrary } from "../stdlib/StdLibrary"
import { MKDIRP, RIMRAF } from "../toolbox/fsHelpers"
import $ from 'js-itertools'
import { instrsToCmds } from "../codegen/Instructions"
import { FnFile } from "../codegen/FnFile"
import { Logger } from "../toolbox/Logger"
import { HoistingMaster, UnreadableHoistingMaster } from "../semantics/managers/HoistingMaster"
import { FileTree, loadFileTree, allParsingFiles } from "../toolbox/FileTree"
import { ProgramManager, Program } from "../semantics/managers/ProgramManager"
import { parseModule } from "../semantics/parseModule"
import { ASTModuleNode } from "../syntax/AST"
import { SymbolTable } from "../semantics/declarations/SymbolTable"
import { Scope } from "../semantics/Scope"
import { parseFileTree } from "../semantics/parseModuleTree"

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
						this.output,
						this.packJson.compilerOptions.debugBuild,
						fnf.mergeBuffers((namePath:string[])=>this.output.functions.createFn(namePath)),
						fnf.getHeader()
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

export async function compile(logger:Logger,cfg:PackJSON,src:FileTree): Promise<Maybe<CompileResult>> {

	const maybe = new MaybeWrapper<CompileResult>()

	const ctx = new CompileContext(
		logger,
		cfg.compilerOptions,
		await SyntaxSheet.load(cfg.compilerOptions.targetVersion)
	)

	if (!checkVersion(compilerVersion,ctx.options.minimumVersion)) {
		logger.log(0,'err',`Pack requires compiler version ${ctx.options.minimumVersion}, currently installed: ${compilerVersion}`)
		return maybe.none()
	}
	
	logger.logGroup(1,'inf',`Begin compilation`)
	let start = moment()

	const pfiles = allParsingFiles(src)
	
	const programManager = new ProgramManager()
	
	logger.log(1,'inf',`Loaded ${pfiles.length} file(s)`)
	
	pfiles.forEach(pf=>lexer(pf,ctx))
	logger.log(1,'inf',`Lexical analysis complete`)

	pfiles.forEach(pf=>fileSyntaxParser(pf,ctx))
	logger.log(1,'inf',`Syntax analysis complete`)

	let gotErrors = false

	parseFileTree(src,programManager,ctx)

	if (!programManager.flushDefered().value)
		gotErrors = true

	/*for (let h of programManager.getUnreferenced()) {
		logger.addError(h.getToken().warning('Never referenced'))
	}*/

	if (!programManager.flushAll(logger).value)
		gotErrors = true

	if (!gotErrors)
		logger.log(1,'inf',`Semantical analysis complete`)
	else
		logger.log(1,'err',`Semantical analysis failed`)

	const output = new OutputManager(cfg.compilerOptions)
	if (!gotErrors) {

		generate(programManager.parseTree,output)
		logger.log(1,'inf',`Generation complete`)

		logger.log(0,'wrn',`No verifier function yet`)
		logger.log(1,'inf',`Verification complete`)

		logger.log(1,'inf',`Compilation complete`)
		logger.log(2,'inf',`Elapsed time: ${(moment.duration(moment().diff(start)) as any).format()}`)

	}

	if (logger.hasErrors()) {
		logger.logErrors()
		logger.log(0,'err',`Raised ${logger.getErrorCount()} error${logger.getErrorCount()>1?'s':''}`)
	}

	if (logger.hasWarnings()) {
		logger.logWarns()
		logger.log(0,'wrn',`Raised ${logger.getWarningCount()} warning${logger.getWarningCount()>1?'s':''}`)
	}

	if (logger.hasErrors())
		return maybe.none()

	if (logger.hasErrors()||gotErrors)
		return maybe.none()

	return maybe.wrap(new CompileResult(cfg,output))

}
