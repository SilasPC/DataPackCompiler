
import { ASTLetNode } from "../syntax/AST";
import { Scoreboard } from "../semantics/ESR";
import { CompileContext } from "./CompileContext";
import { Scope } from "../semantics/Scope";
import { CompilerOptions } from "./config";
import { getQualifiedName, getObscureName } from "./other";

export class ScoreboardManager {

	private globalStatic: string
	private globalConst: string
	private constants: Map<number,Scoreboard> = new Map()
	private globals: Set<string> = new Set()

	constructor(
		private readonly options: CompilerOptions
	) {
		[this.globalStatic, this.globalConst] =
			options.obscureNames ?
				[this.generateObscure(),this.generateObscure()] :
				[this.generateName(['globals']),this.generateName(['constants'])]
	}

	getStatic(names:string[]): Scoreboard {
		let ret = {
			scoreboard: this.globalStatic,
			selector:
				this.options.obscureNames ?
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
				this.options.obscureNames ?
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

	private generateName(names:string[]) {
		let name = getQualifiedName(names,this.globals,16)
		this.globals.add(name)
		return name
	}

}
