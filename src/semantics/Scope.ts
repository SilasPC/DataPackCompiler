
import { SymbolTable } from "./declarations/SymbolTable";
import { HoistingMaster } from "./managers/HoistingMaster";
import { Program } from "./managers/ProgramManager";

export class Scope {

	public static createRoot(program: Program, name:string) {
		return new Scope(
			null,
			SymbolTable.createRoot(program),
			name
		)
	}

	protected constructor(
		private readonly parent: Scope|null,
		public readonly symbols: SymbolTable,
		public readonly scopeName: string
	) {}

	branchWithNewSymbolTable(name:string, program: Program) {
		return new Scope(this,SymbolTable.createRoot(program),name)
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
