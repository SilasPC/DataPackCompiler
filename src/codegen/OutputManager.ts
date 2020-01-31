import { ScoreboardManager } from "./ScoreboardManager";
import { CompilerOptions } from "../toolbox/config";
import { FnFileManager } from "./FnFileManager";

export class OutputManager {

	public readonly scoreboards: ScoreboardManager
	public readonly functions: FnFileManager
	
	constructor(
		private readonly options: CompilerOptions
	) {
		this.scoreboards = new ScoreboardManager(options)
		this.functions = new FnFileManager(options)
	}

}
