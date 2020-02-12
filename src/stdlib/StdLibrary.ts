import { createAbs } from "./math/abs";
import { CompileContext } from "../toolbox/CompileContext";
import { Declaration, ModDeclaration, DeclarationWrapper, DeclarationType } from "../semantics/declarations/Declaration";
import { TokenI, TokenType } from "../lexing/Token";
import { Maybe, MaybeWrapper } from "../toolbox/Maybe";
import { createDouble } from "./math/double";
import { SymbolTable, ReadOnlySymbolTable } from "../semantics/declarations/SymbolTable";

type Lib = {[key:string]:(Lib|((ctx:CompileContext)=>Declaration))}

const stdlib: Lib = {
	'Math': {
		abs: createAbs,
		double: createDouble
	}
}

export class StdLibrary implements ReadOnlySymbolTable {
	
	static create(ctx:CompileContext) {
		return new StdLibrary(ctx,stdlib,['std']) as ReadOnlySymbolTable
	}

	private readonly loaded: Map<string,Declaration> = new Map()

	private constructor(
		private readonly ctx: CompileContext,
		private readonly lib: Lib,
		private namePath: ReadonlyArray<string>
	) {}

	getDeclaration(name: TokenI): Maybe<DeclarationWrapper> {
		/*const maybe = new MaybeWrapper<DeclarationWrapper>()
		let val
		if (name.type == TokenType.PRIMITIVE)
				val = name.value.slice(1,-1)
		else
				val = name.value
		if (this.loaded.has(val)) return maybe.wrap({
			token: name,
			decl: this.loaded.get(val) as Declaration
		})
		if (val in this.lib) {
			let sub = this.lib[val]
			let decl: Declaration
			if (sub instanceof Function) {
				this.ctx.logger.log(3,'inf',`loading std declaration '${val}'`)
				this.loaded.set(val,decl = sub(this.ctx))
			} else
				this.loaded.set(val,decl = {type:DeclarationType.MODULE,namePath:this.namePath,symbols:new StdLibrary(this.ctx,sub,this.namePath.concat(name.value))})
			return maybe.wrap({token:name,decl})
		}
		return maybe.none()*/
		throw new Error('no std yet')
	}

}