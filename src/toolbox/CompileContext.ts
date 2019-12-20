import { CompilerOptions, compilerOptionDefaults } from "./config";
import { SyntaxSheet } from "../commands/SyntaxSheet";
import { ScoreboardManager } from "./ScoreboardManager";

export class CompileContext {

	static getDefaultWithNullSheet() {
		return new CompileContext(
			compilerOptionDefaults({}),
			SyntaxSheet.getNullSheet()
		)
	}

	public readonly scoreboards: ScoreboardManager = new ScoreboardManager()

	constructor(
		public readonly options: CompilerOptions,
		public readonly syntaxSheet: SyntaxSheet
	) {}

	log(level:number,msg:string) {
		if (level <= this.options.verbosity) console.log(msg)
	}

}