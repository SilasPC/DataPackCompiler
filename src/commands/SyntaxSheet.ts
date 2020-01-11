import { RootCMDNode } from "./CMDNode";
import { fromSheet, fromString } from "./sheetParser";
import { TokenI } from "../lexing/Token";
import { CompileContext } from "../toolbox/CompileContext";
import { Scope } from "../semantics/Scope";
import { ASTCMDNode, ASTNodeType, ASTNode } from "../syntax/AST";

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

	readSyntax(token:TokenI,ctx:CompileContext): ASTCMDNode {
		return {
			type: ASTNodeType.COMMAND,
			token,
			consume: this.root.parseSyntax(token,1,ctx)
		}
	}

	/*verifySemantics(token:Token,ctx:CompileContext,scope:Scope) {
		return this.root.test(token,1,{scope,ctx})
	}*/

}
