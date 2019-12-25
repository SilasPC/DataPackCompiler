
import { Instruction } from "../semantics/Instructions"

export class FnFile {
	
	constructor(
		public readonly name: string,
		private readonly code: Instruction[] = []
	) {}

	get() {return this.code}

	add(...instrs:Instruction[]) {this.code.push(...instrs)}

}
