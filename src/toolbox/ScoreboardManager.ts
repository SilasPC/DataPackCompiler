
import { ASTLetNode } from "../syntax/AST";

export class ScoreboardManager {

	private scoreboard = 'the_scoreboard'
	private constants: Map<number,ScoreDeclaration> = new Map()

	getStatic(node:ASTLetNode): ScoreDeclaration {
		let decl: ScoreDeclaration = {
			type: DeclarationType.SCORE,
			node,
			scoreboard: this.scoreboard,
			selector: generateIdentifier()
		}
		return decl
	}

	getConstant(n:number): ScoreDeclaration {
		if (this.constants.has(n))
			return this.constants.get(n) as ScoreDeclaration
		if (!Number.isInteger(n)) throw new Error('Can only use integer constant scores')
		let decl: ScoreDeclaration = {
			type: DeclarationType.SCORE,
			node: null,
			scoreboard: this.scoreboard,
			selector: generateIdentifier()
		}
		this.constants.set(n,decl)
		return decl
	}

}
