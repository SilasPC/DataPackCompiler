import { RootCMDNode } from "./CMDNode";
import { fromSheet, fromString } from "./sheetParser";
import { Token } from "../lexing/Token";

export class SyntaxSheet {

	public static fromString(string:string) {
		return new SyntaxSheet(fromString(string))
	}

	public static async load(version:string) {
		return new SyntaxSheet(await fromSheet(version))
	}

	public static getNullSheet() {
		return new SyntaxSheet(new RootCMDNode('',false,[]))
	}

	private constructor(
		private readonly root: RootCMDNode
	) {}

	verifySyntax(token:string): boolean
	verifySyntax(token:Token): boolean
	verifySyntax(token:Token|string): boolean {
		if (typeof token == 'string') return this.root.test(token.slice(1))
		return this.root.test(token.value.slice(1))
	}

	verifySemantics(token:Token) {

	}

}
