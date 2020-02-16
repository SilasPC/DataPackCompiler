import { RootCMDNode } from "./CMDNode";
import { fromSheet, fromString } from "./sheetParser";
import { TokenI } from "../lexing/Token";
import { ASTCMDNode } from "../syntax/AST";
import { CompileError } from "../toolbox/CompileErrors";
import { Logger } from "../toolbox/Logger";
import { Result, ResultWrapper } from "../toolbox/Result";

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

	verifySyntaxNoSlash(token:TokenI): CompileError | null {
		let res = this.root.syntaxParseNoSlash(token)
		if (res instanceof CompileError) return res
		return null
	}

	readSyntax(token:TokenI): Result<ASTCMDNode,null> {
		const result = new ResultWrapper<ASTCMDNode,null>()
		let res = this.root.syntaxParse(token)
		if (res instanceof CompileError) {
			result.addError(res)
			return result.none()
		}
		return result.wrap(new ASTCMDNode(token.line.file,token.indexStart,token.indexEnd,token,res))
	}

	/*verifySemantics(token:Token,ctx:CompileContext,scope:Scope) {
		return this.root.test(token,1,{scope,ctx})
	}*/

}
