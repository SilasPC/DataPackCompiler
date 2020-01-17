import { RootCMDNode } from "./CMDNode";
import { fromSheet, fromString } from "./sheetParser";
import { TokenI } from "../lexing/Token";
import { CompileContext } from "../toolbox/CompileContext";
import { Scope } from "../semantics/Scope";
import { ASTCMDNode, ASTNodeType, ASTNode } from "../syntax/AST";
import { Maybe, MaybeWrapper } from "../toolbox/Maybe";
import { CompileError } from "../toolbox/CompileErrors";

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

	readSyntax(token:TokenI,ctx:CompileContext): Maybe<ASTCMDNode> {
		const maybe = new MaybeWrapper<ASTCMDNode>()
		let res = this.root.syntaxParse(token,ctx)
		if (res instanceof CompileError) {
			ctx.addError(res)
			return maybe.none()
		}
		return maybe.wrap({
			type: ASTNodeType.COMMAND,
			token,
			consume: res
		})
	}

	/*verifySemantics(token:Token,ctx:CompileContext,scope:Scope) {
		return this.root.test(token,1,{scope,ctx})
	}*/

}
