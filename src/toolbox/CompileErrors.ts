
import { SourceLine } from "../lexing/SourceLine"
import cols from 'colors/safe'
import { ModuleFile } from "../input/InputTree"

export type ErrorType = 'File' | 'Syntax' | 'Type' | 'Internal'

export class CompileError extends Error {

	constructor(
		protected readonly err: string
	) {super(err)}

	getErrorMsg() {return this.err}

}

export class SourceCodeError extends CompileError {

	constructor(
		mod: ModuleFile,
		indexStart: number,
		indexEnd: number,
		msg: string
	) {
		super(createErrorMessage(mod,indexStart,indexEnd,msg))
	}

}


function createErrorMessage(mod:ModuleFile,fi:number,li:number,err:string) {

	let fl = mod.getLineFromIndex(fi), ll = mod.getLineFromIndex(li)
	
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

