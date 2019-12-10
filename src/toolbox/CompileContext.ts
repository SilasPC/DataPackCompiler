import { CompilerOptions } from "./config";
import { SyntaxSheet } from "../commands/SyntaxSheet";

export class CompileContext {

	constructor(
		public readonly options: CompilerOptions,
		public readonly syntaxSheet: SyntaxSheet
	) {}

}