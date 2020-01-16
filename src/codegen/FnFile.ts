
import { Instruction } from "./Instructions"
import { InstrWrapper } from "./InstrWrapper"

export class FnFile extends InstrWrapper {
	
	private dead = false

	constructor(
		public readonly name: string
	) {super()}

	isDead() {return this.dead}
	declareDead() {this.dead = true}

}
