
import { ASTLetNode } from "../syntax/AST";
import { Scoreboard } from "../semantics/ESR";
import { CompileContext } from "./CompileContext";
import { Scope } from "../semantics/Scope";
import { CompilerOptions } from "./config";

export class ScoreboardManager {

	private globalStatic = 'globals'
	private globalConst = 'constants'
	private constants: Map<number,Scoreboard> = new Map()
	private globals: Set<string> = new Set()

	constructor(
		private readonly options: CompilerOptions
	) {}

	getStatic(name:string,scope:Scope): Scoreboard {
		let ret = {
			scoreboard: this.globalStatic,
			selector:
				this.options.obscureNames ?
					this.generateObscure() :
					this.generateName(scope.getScopeNames().concat(name))
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
				this.options.obscureNames ?
					this.generateObscure() :
					n.toString()
		}
		this.constants.set(n,score)
		return score
	}

	private generateObscure() {
		while (true) {
			let name = Math.random().toString(16).substr(2,8)
			if (!this.globals.has(name)) return name
		}
	}

	private generateName(names:string[]) {
		let name = names.join('_')
		if (name.length > 16) {
			name = name.replace(/[aeyuio]/g,'')
			names = names.slice(-16)
		}
		if (!this.globals.has(name)) {
			this.globals.add(name)
			return name
		}
		let nr = 1
		while (true) {
			let name2 = name + nr++
			if (name2.length > 16) name2 = name2.slice(-16)
			if (!this.globals.has(name2)) {
				this.globals.add(name2)
				return name2
			}
		}
	}

}
