import { RootCMDNode } from "./CMDNode";
import { fromSheet, fromString } from "./sheetParser";
import { TokenI, DirectiveToken } from "../lexing/Token";
import { CompileContext } from "../toolbox/CompileContext";
import { Scope } from "../semantics/Scope";
import { ASTCMDNode, ASTNodeType, ASTNode } from "../syntax/AST";
import { Maybe, MaybeWrapper } from "../toolbox/Maybe";
import { CompileError } from "../toolbox/CompileErrors";
import { Logger } from "../toolbox/Logger";

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

	readSyntax(token:TokenI,log:Logger): Maybe<ASTCMDNode> {
		const maybe = new MaybeWrapper<ASTCMDNode>()
		let res = this.root.syntaxParse(token)
		if (res instanceof CompileError) {
			log.addError(res)
			return maybe.none()
		}
		return maybe.wrap(new ASTCMDNode(token.line.file,token.indexStart,token.indexEnd,token,res))
	}

	/*verifySemantics(token:Token,ctx:CompileContext,scope:Scope) {
		return this.root.test(token,1,{scope,ctx})
	}*/

}
