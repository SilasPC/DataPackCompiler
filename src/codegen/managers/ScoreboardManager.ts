
import { CompilerOptions } from "../../toolbox/config"
import { getObscureName, getQualifiedName } from "../../toolbox/other"
import { Declaration } from "../../semantics/declarations/Declaration"
import { Config } from "../../api/Configuration"

export interface Scoreboard {
	selector: string
	scoreboard: string
}

export class ScoreboardManager {

	private readonly globalStatic: string
	private readonly globalConst: string
	private readonly constants = new Map<number,Scoreboard>()
	private readonly globals = new Set<string>()

	private readonly declMap = new Map<Declaration,Scoreboard>()

	private readonly scoreboardNames = new Set<string>()

	constructor(
		private readonly cfg: Config
	) {
		[this.globalStatic, this.globalConst] =
			cfg.compilation.obscureNames ?
				[this.generateObscure(),this.generateObscure()] :
				[this.generateName(['globals']),this.generateName(['constants'])]
		this.scoreboardNames.add(this.globalConst).add(this.globalStatic)
	}

	getScoreboard(names:ReadonlyArray<string>): string {
		let ret = this.cfg.compilation.obscureNames ?
					getObscureName(this.scoreboardNames) :
					getQualifiedName(names,this.scoreboardNames,16)
		this.scoreboardNames.add(ret)
		return ret
	}

	getDecl(decl:Declaration) {
		if (this.declMap.has(decl)) return this.declMap.get(decl) as Scoreboard
		let sb = this.getStatic(decl.namePath)
		this.declMap.set(decl,sb)
		return sb
	}

	getStatic(names:ReadonlyArray<string>): Scoreboard {
		let ret = {
			scoreboard: this.globalStatic,
			selector:
				this.cfg.compilation.obscureNames ?
					this.generateObscure() :
					this.generateName(names)
		}
		this.globals.add(ret.selector)
		return ret
	}

	getConstant(n:number): Scoreboard {
		if (this.constants.has(n))
			return this.constants.get(n) as Scoreboard
		if (!Number.isInteger(n)) throw new Error('Can only use integer constant scores')
		let score = {
			scoreboard: this.globalConst,
			selector:
				this.cfg.compilation.obscureNames ?
					this.generateObscure() :
					n.toString()
		}
		this.constants.set(n,score)
		return score
	}

	private generateObscure() {
		let name = getObscureName(this.globals)
		this.globals.add(name)
		return name
	}

	private generateName(names:ReadonlyArray<string>) {
		let name = getQualifiedName(names,this.globals,16)
		this.globals.add(name)
		return name
	}

}
