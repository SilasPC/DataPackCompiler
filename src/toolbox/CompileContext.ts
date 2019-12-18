import { CompilerOptions, compilerOptionDefaults } from "./config";
import { SyntaxSheet } from "../commands/SyntaxSheet";

export class CompileContext {

	static getDefaultWithNullSheet() {
		return new CompileContext(
			compilerOptionDefaults({}),
			SyntaxSheet.getNullSheet()
		)
	}

	constructor(
		public readonly options: CompilerOptions,
		public readonly syntaxSheet: SyntaxSheet
	) {}

	log(level:number,msg:string) {
		if (level <= this.options.verbosity) console.log(msg)
	}

}