import { ParsingFile } from "../toolbox/ParsingFile"
import { createErrorMessage } from "../toolbox/CompileErrors"

export class SourceLine {

	public next: SourceLine|null = null

	constructor(
			public readonly previous: SourceLine|null,
			public readonly file: ParsingFile,
			public readonly startIndex: number,
			public readonly line: string,
			public readonly nr: number
	) {}

	fatal(e:string,index:number,length:number): never {
			throw new Error(createErrorMessage(
					this,this,
					this.startIndex + index,
					this.startIndex + index + length,
					e
			))
	}

}
