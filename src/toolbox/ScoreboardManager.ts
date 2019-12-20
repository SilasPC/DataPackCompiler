
import { ASTLetNode } from "../syntax/AST";
import { Scoreboard } from "../semantics/ESR";

export class ScoreboardManager {

	private globalStatic = 'globals'
	private globalConst = 'constants'
	private constants: Map<number,Scoreboard> = new Map()

	getStatic(): Scoreboard {
		return {
			scoreboard: this.globalStatic,
			selector: Math.random().toString(16).substr(2,8)
		}
	}

	getConstant(n:number): Scoreboard {
		if (this.constants.has(n))
			return this.constants.get(n) as Scoreboard
		if (!Number.isInteger(n)) throw new Error('Can only use integer constant scores')
		let score = {
			scoreboard: this.globalConst,
			selector: Math.random().toString(16).substr(2,8)
		}
		this.constants.set(n,score)
		return score
	}

}
