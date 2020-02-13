
import { SymbolTable } from "./declarations/SymbolTable";
import { Program } from "./managers/ProgramManager";
import { ValueType } from "./types/Types";
import { PTReturn, PTExpr } from "./ParseTree";
import { FnDeclaration } from "./declarations/Declaration";

export class Scope {

	protected constructor(
		private readonly parent: Scope|null,
		public readonly symbols: SymbolTable,
		public readonly scopeName: string
	) {}

	lastFnScope(): FnScope | null {
		if (this instanceof FnScope) return this
		if (this.parent) return this.parent.lastFnScope()
		return null
	}

	branch(name:string) {
		return new Scope(this,this.symbols.branch(),name)
	}

	nameAppend(name:string) {return this.getScopeNames().concat(name)}

	getScopeNames(): string[] {
		let names = [this.scopeName]
		if (this.parent) names = this.parent.getScopeNames().concat(names)
		return names
	}

}

export class ModScope extends Scope {

	public static createRoot(program: Program, name:string) {
		return new ModScope(
			null,
			SymbolTable.createRoot(program),
			name
		)
	}

	constructor(parent:Scope|null,symbols:SymbolTable,scopeName:string) {super(parent,symbols,scopeName)}

	branchToMod(name:string, program: Program) {
		return new ModScope(this,SymbolTable.createRoot(program),name)
	}
	
	branchToFn(name:string,decl:FnDeclaration) {
		return new FnScope(decl,this,this.symbols.branch(),name)
	}

}

export class FnScope extends Scope {

	constructor(
		public readonly declaration: FnDeclaration,
		parent: Scope|null,
		symbols: SymbolTable,
		scopeName:string
	) {super(parent,symbols,scopeName)}

}
