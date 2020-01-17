
import { SourceLine } from "../lexing/SourceLine"
import cols from 'colors/safe'

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
	let nrLen = (ll.nr+1).toString().length
	let ws = ' '.repeat(nrLen+2)
	
	msg.push(`At ("${fl.file.displayName}":${fl.nr}:${fi-fl.startIndex}):`)
	msg.push(err.split('\n').map(s=>`${ws}# ${s}`).join('\n'))
	msg.push(`${ws}|`)

	if (fl.previous)
			msg.push(` ${(fl.nr-1).toString().padStart(nrLen,' ')} | ${fl.previous.line}`)

	let l: SourceLine | null = fl
	let lines: (string|SourceLine)[] = []
	while ((ll.next ? l != ll.next : true) && l != null) {
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

