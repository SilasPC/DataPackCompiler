
import { SymbolTable } from "./SymbolTable";

export class Scope {

	public static createRoot(name:string) {
		return new Scope(
			null,
			SymbolTable.createRoot(),
			name
		)
	}

	protected constructor(
		private readonly parent: Scope|null,
		public readonly symbols: SymbolTable,
		private readonly name: string
	) {}

	branch(name:string) {
		return new Scope(this,this.symbols.branch(),name)
	}

	nameAppend(name:string) {return this.getScopeNames().concat(name)}

	getScopeNames(): string[] {
		let names = [this.name]
		if (this.parent) names = this.parent.getScopeNames().concat(names)
		return names
	}

}
