
import { CompilerOptions, compilerOptionDefaults } from "./config";
import { SyntaxSheet } from "../commands/SyntaxSheet";
import { Logger } from "./Logger";

export class CompileContext {

	constructor(
		public readonly logger: Logger,
		public readonly options: CompilerOptions,
		public readonly syntaxSheet: SyntaxSheet
	) {}

}
