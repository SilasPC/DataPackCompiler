import { ScoreboardManager, Scoreboard } from './ScoreboardManager';
import { CompilerOptions } from '../../toolbox/config';
import { FnFileManager } from './FnFileManager';
import { Config } from '../../api/Configuration';
import { TagManager } from './TagManager';
import { MiscManager } from './MiscManager';

export class OutputManager {

	public readonly misc: MiscManager
	public readonly scoreboards: ScoreboardManager
	public readonly functions: FnFileManager
	public readonly tags: TagManager
	
	constructor(
		cfg: Config
	) {
		this.scoreboards = new ScoreboardManager(cfg)
		this.functions = new FnFileManager(cfg)
		this.tags = new TagManager()
		this.misc = new MiscManager(cfg)
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
