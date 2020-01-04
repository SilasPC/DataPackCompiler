
import { SourceLine } from "../lexing/Token"
import cols from 'colors/safe'

interface Exists<T> extends Base<T> {
	valueExists: true,
	value: T
}

interface NotExists<T> extends Base<T> {
	valueExists: false,
	value: undefined
}

export type Possible<T> = Exists<T> | NotExists<T>

abstract class Base<T> {
	
	constructor (
		public readonly wrapper: ReturnWrapper<T>,
		public readonly valueExists: boolean
	) {}

	hasError(): this is NotExists<T> {return !this.valueExists}
	hasValue(): this is Exists<T> {return this.valueExists}

}

class DefinitePossible<T> extends Base<T> implements Exists<T> {

	public readonly valueExists = true

	constructor(
		wrapper: ReturnWrapper<T>,
		public readonly value: T
	) {
		super(wrapper,true)
		if (wrapper.hasErrors())
			throw new Error('instantiated possible with value and error')
	}

}

class NotPossible<T> extends Base<T> implements NotExists<T> {
	
	public readonly valueExists = false
	public readonly value = undefined

	constructor(
		wrapper: ReturnWrapper<T>
	) {
		super(wrapper,false)
		if (!wrapper.hasErrors())
			throw new Error('instantiated not possible with no errors')
	}

}

export class ReturnWrapper<T> {

	private readonly errors: Set<CompileError> = new Set()
	private readonly warnings: Set<CompileError> = new Set()

	getErrors() {return this.errors}
	getWarnings() {return this.warnings}
	hasWarnings() {return this.warnings.size > 0}
	hasErrors() {return this.errors.size > 0}

	getErrorCount() {return this.errors.size}
	getWarningCount() {return this.warnings.size}

	/**
	 * Merges any errors and returns true if there were any errors to merge.
	 * It also casts argument to NotExists<P>
	 */
	merge<P>(arg:Possible<P>): arg is NotExists<P>
	merge<P>(arg:ReturnWrapper<P>): void
	merge<P>(arg:ReturnWrapper<P>|Possible<P>): boolean | void {
		let val = arg instanceof ReturnWrapper ? arg : arg.wrapper
		for (let err of val.errors) this.errors.add(err)
		for (let err of val.warnings) this.warnings.add(err)
		if (arg instanceof Base) return arg.hasError()
	}

	push(error:CompileError): this {
		if (error.warnOnly) this.warnings.add(error)
		else this.errors.add(error)
		return this
	}

	wrap(val:CompileError): NotExists<T>
	wrap(val:Possible<T>): Possible<T>
	wrap(val:NotExists<any>): Possible<T>
	wrap(val:T): Possible<T>
	wrap(val:T|CompileError|Base<any>): Possible<T> {
		if (val instanceof Base) {
			if (val.hasValue())
				return val
			for (let err of val.wrapper.errors) this.errors.add(err)
			for (let err of val.wrapper.warnings) this.warnings.add(err)
			return new NotPossible(this)
		}
		if (val instanceof CompileError) {
			this.push(val)
			return new NotPossible<T>(this)
		}
		if (this.hasErrors()) return new NotPossible<T>(this)
		return new DefinitePossible<T>(this,val)
	}

}

export class CompileError extends Error {

	constructor(
		/*public readonly pfile: ParsingFile,
		public readonly indexStart: number,
		public readonly indexEnd: number,
		public readonly msg: string*/
		private readonly errorString: string,
		public readonly warnOnly: boolean
	) {
		super(errorString)
	}

	getErrorString() {
		return this.errorString
	}

}

export function createErrorMessage(fl:SourceLine,ll:SourceLine,fi:number,li:number,err:string) {
	
	let msg: string[] = []
	let nrLen = ll.nr.toString().length
	let ws = ' '.repeat(nrLen+2)
	
	msg.push(`At ("${fl.file.relativePath}":${fl.nr}:${fi-fl.startIndex}):`)
	msg.push(`${ws}${err}`)
	msg.push(`${ws}|`)

	if (fl.previous)
			msg.push(` ${(fl.nr-1).toString().padStart(nrLen,' ')} | ${fl.previous.line}`)

	let l: SourceLine | null = fl
	let lines: (string|SourceLine)[] = [fl]
	while (l != ll && l != null) {
			lines.push(l)
			l = l.next
	}

	if (lines.length > 3) {
			let prevLine = lines[0] as SourceLine
			let placeholder = ':'.repeat((prevLine.nr).toString().length).padStart(nrLen,' ')
			lines = lines.slice(0,1).concat(` ${placeholder} |`,lines.slice(-1))
	}

	for (let line of lines) {

			if (typeof line == 'string') {
					msg.push(line)
					continue
			}

			let wss = line.line.length - line.line.trimLeft().length

			let c0 = Math.max(fi-line.startIndex,wss)
			let c1 = Math.min(li-line.startIndex,line.line.trimRight().length)

			msg.push(` ${line.nr.toString().padStart(nrLen,' ')} | ${line.line.slice(0,c0)}${
					cols.inverse(line.line.slice(c0,c1))
			}${line.line.slice(c1)}`)

	}
	
	if (ll.next)
			msg.push(` ${(ll.nr+1).toString().padStart(nrLen,' ')} | ${ll.next.line}`)
	
	// msg.push(`${ws}| ${' '.repeat(i)}${'^'.repeat(l)}`)
	msg.push(`${ws}|`)
	return msg.join('\n')

}

