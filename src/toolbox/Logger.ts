import { CompilerOptions } from "./config"
import cols from 'colors/safe'
import { CompileError } from "./CompileErrors"
import { ResultWrapper } from "./Result"

type LogType = 'inf' | 'err' | 'wrn'

export interface LogOptions {
	verbosity: number
	shortFormat: boolean
	ignoreWarnings: boolean
	useColor: boolean
}

export class Logger {

	constructor(
		public readonly options: LogOptions
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
		if (!this.options.useColor) col = (s:string) => s

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

		this.lastLogType = type

	}

	/** Returns true if there were any errors (not warnings) */
	raiseErrors(res:ResultWrapper<any,any>): boolean {
		if (res.hasWarnings()) {
			this.logWrns(res)
			this.log(0,'wrn',`Raised ${res.getWarnings().size} warning${res.getWarnings().size>1?'s':''}`)
		}
	
		if (res.hasErrors()) {
			this.logErrs(res)
			this.log(0,'err',`Raised ${res.getErrors().size} error${res.getErrors().size>1?'s':''}`)
			return true
		}
		return false
	}

	private logErrs(res:ResultWrapper<any,any>) {
		for (let err of res.getErrors()) {
			this.lastLogType = null
			this.log(0,'err',err.getErrorMsg(this.options.shortFormat))
		}
		this.lastLogType = null
	}
	
	private logWrns(res:ResultWrapper<any,any>) {
		for (let err of res.getWarnings()) {
			this.lastLogType = null
			this.log(0,'wrn',err.getErrorMsg(this.options.shortFormat))
		}
		this.lastLogType = null
	}

}