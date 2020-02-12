import { CompilerOptions } from "./config"
import cols from 'colors/safe'
import { CompileError } from "./CompileErrors"

type LogType = 'inf' | 'err' | 'wrn'

export class Logger {

	constructor(
		public readonly options: CompilerOptions
	) {}

	private lastLogType: LogType|null = null
	logGroup(level:number,type:LogType,msg:string) {
		this.lastLogType = null
		this.log(level,type,msg)
	}
	log(level:number,type:LogType,msg:string) {
		if (type == 'wrn' && this.options.ignoreWarnings) return
		if (level > this.options.verbosity) return
		let col = type == 'inf' ? cols.green : type == 'wrn' ? cols.yellow : cols.red
		if (!this.options.colorLog) col = (s:string) => s

		let pad = col('    ] ')
		let padh = col(`\n[${type}] `)
		console.log(
			msg
				.split('\n')
				.map((s,i) =>
					col(
						i==0 && this.lastLogType != type ? padh : pad
					) + s
				)
				.join('\n')
		)

		// this.lastLogLevel2 = level
		this.lastLogType = type

	}

	private readonly errs = new Set<CompileError>()
	private readonly wrns = new Set<CompileError>()

	addError(err:CompileError) {
		if (err.warnOnly) this.wrns.add(err)
		else this.errs.add(err)
	}

	hasErrors() {return this.errs.size > 0}
	getErrorCount() {return this.errs.size}
	hasWarnings() {return this.wrns.size > 0}
	getWarningCount() {return this.wrns.size}

	logErrors() {
		for (let err of this.errs) {
			this.lastLogType = null
			this.log(0,'err',err.getErrorString())
		}
		this.lastLogType = null
	}

	logWarns() {
		for (let err of this.wrns) {
			this.lastLogType = null
			this.log(0,'wrn',err.getErrorString())
		}
		this.lastLogType = null
	}

}