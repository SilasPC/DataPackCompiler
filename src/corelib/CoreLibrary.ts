import { createAbs } from "./math/abs";
import { CompileContext } from "../toolbox/CompileContext";
import { Declaration, ModDeclaration, DeclarationWrapper } from "../semantics/Declaration";
import { TokenI, TokenType } from "../lexing/Token";
import { Maybe } from "../toolbox/Maybe";
import { createDouble } from "./math/double";

type Lib = {[key:string]:Lib|((ctx:CompileContext)=>Declaration)}

const lib: Lib  = {
	'Math': {
		abs: createAbs,
		double: createDouble
	}
}

export class CoreLibrary extends ModDeclaration {

	static create(ctx:CompileContext) {
		return new CoreLibrary(ctx,lib)
	}

	private readonly loaded: Map<string,Declaration> = new Map()

	private constructor(
		private readonly ctx: CompileContext,
		private readonly lib: Lib
	) {super()}

	getDeclaration(name: TokenI): DeclarationWrapper | null {
		let val
		if (name.type == TokenType.PRIMITIVE)
				val = name.value.slice(1,-1)
		else
				val = name.value
		if (this.loaded.has(val)) return {
			token: name,
			decl: this.loaded.get(val) as Declaration
		}
		if (val in this.lib) {
			let sub = this.lib[val]
			let decl: Declaration
			if (sub instanceof Function)
				this.loaded.set(val,decl = sub(this.ctx))
			else
				this.loaded.set(val,decl  = new CoreLibrary(this.ctx,sub))
			return {token:name,decl}
		}
		return null
	}

}