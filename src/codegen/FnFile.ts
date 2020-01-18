
import { Instruction } from "./Instructions"
import { InstrWrapper } from "./InstrWrapper"

export class FnFile extends InstrWrapper {
	
	private dead = false

	constructor(
		public readonly name: string,
		private readonly headerComments: string[]
	) {super()}
	
	getHeader() {
		return this.headerComments.map(h=>'#> '+h).concat('')
	}

	isDead() {return this.dead}
	declareDead() {this.dead = true}

}
