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

	public readonly scoreboards: ScoreboardManager = new ScoreboardManager(this.options)

	constructor(
		public readonly options: CompilerOptions,
		public readonly syntaxSheet: SyntaxSheet
	) {}

	private lastLogLevel = 0
	log(level:number,msg:string) {
		if (this.lastLogLevel > level) console.log()
		let pad = ''
		if (level > 1) pad = ' '.repeat(2 * level - 3) + '- '
		if (level <= this.options.verbosity) console.log(pad + msg)
		this.lastLogLevel = level
	}

}