
import { SourceCodeError } from "../toolbox/CompileErrors"
import { ModuleFile } from "../input/InputTree"

export class SourceLine {

	public next: SourceLine|null = null

	public readonly indexEnd: number

	constructor(
			public readonly previous: SourceLine|null,
			public readonly file: ModuleFile,
			public readonly startIndex: number,
			public readonly line: string,
			public readonly nr: number
	) {
		this.indexEnd = startIndex + line.length
	}

	fatal(e:string,index:number,length:number): never {
			throw new SourceCodeError(
					this.file,
					this.startIndex + index,
					this.startIndex + index + length,
					e
			)
	}

}
