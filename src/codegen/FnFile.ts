
export class FnFile {

	private readonly code: string[] = []

	constructor(
		public readonly name: string
	) {}

	getCode() {return this.code}

	addLines(...lines:string[]) {this.code.push(...lines)}

}