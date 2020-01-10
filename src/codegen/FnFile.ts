
import { Instruction } from "./Instructions"

export class FnFile {
	
	private dead = false

	constructor(
		public readonly name: string,
		private readonly code: Instruction[] = []
	) {}

	isDead() {return this.dead}
	declareDead() {this.dead = true}

	get() {return this.code}

	add(...instrs:Instruction[]) {this.code.push(...instrs)}

}
