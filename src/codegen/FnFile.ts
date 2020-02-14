
import { Instruction, InstrType } from "./Instructions"
import { InstrWrapper } from "./InstrWrapper"
import { OutputManager } from "./managers/OutputManager"
import { FnFileManager } from "./managers/FnFileManager"

export class FnFile {

	private instrBuffer: InstrWrapper
	private readonly stack: InstrWrapper[]
	private headerComments: string[] = []

	constructor(
		public readonly mcPath: string,
		public readonly namePath: ReadonlyArray<string>
	) {
		this.stack = [this.instrBuffer = new InstrWrapper()]
	}

	public setHeader(arr:string[]) {
		this.headerComments = [...arr]
	}
	
	public getHeader() {
		return this.headerComments.map(h=>'#> '+h).concat('')
	}
	
	public pushFlowBuffer() {
		// we don't new a new instr buffer if the last one hasn't been used
		if (this.instrBuffer.getLength())
			this.stack.push(this.instrBuffer = new InstrWrapper())
	}

	public mergeBuffers(fnm:FnFileManager): InstrWrapper {
		// if last buffer is empty, remove
		if (
			this.stack.length > 1 &&
			this.stack[this.stack.length-1].getLength() == 0
		) this.stack.pop()

		// temporary merge function
		// we need to do some flow processing here
		// there is for now no 'if' check
		let fns = Array(this.stack.length-1)
			.fill(0)
			.map(()=>fnm.createFn([...this.namePath,'controlflow']))
		fns.forEach((fn,i)=>{
			fn.setHeader([`Control flow ${i+1}`])
			fn.instrBuffer.insertEnd(this.stack[i+1])
			if (fns[i+1]) fn.push({
				type: InstrType.LOCAL_INVOKE,
				fn: fns[i+1]
			})
		})
		let ret = this.stack[0].clone()
		if (fns.length) ret.add({
			type: InstrType.LOCAL_INVOKE,
			fn: fns[0]
		})
		return ret
	}

	public push(...instrs:Instruction[]) {
		this.instrBuffer.add(...instrs)
	}

	public addComments(...cmts:string[]) {
		this.instrBuffer.addSubData(...cmts)
	}

}
