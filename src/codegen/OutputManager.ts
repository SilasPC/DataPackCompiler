import { ScoreboardManager, Scoreboard } from './ScoreboardManager';
import { CompilerOptions } from '../toolbox/config';
import { FnFileManager } from './FnFileManager';

export class OutputManager {

	public readonly scoreboards: ScoreboardManager
	public readonly functions: FnFileManager
	
	constructor(
		private readonly options: CompilerOptions
	) {
		this.scoreboards = new ScoreboardManager(options)
		this.functions = new FnFileManager(options)
	}

	private instrCounter?: Scoreboard
	getInstrCounter() {
		if (this.instrCounter) return this.instrCounter
		return this.instrCounter = this.scoreboards.getStatic(['std','debug','counter'])
	}

	/*private traceScoreboard?: string
	getTraceScoreboard() {
		if (this.traceScoreboard) return this.traceScoreboard
		return this.traceScoreboard = this.scoreboards.getScoreboard(['std','debug','trace'])
	}*/

}
