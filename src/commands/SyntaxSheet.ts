import { RootCMDNode } from "./CMDNode";
import { fromSheet, fromString } from "./sheetParser";
import { Token } from "../lexing/Token";
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

	readSyntax(token:Token,ctx:CompileContext): ASTCMDNode {
		let nodes = this.root.parseSyntax(token,1,ctx)
		return {
			type: ASTNodeType.COMMAND,
			token,
			interpolations: nodes
		}
	}

	/*verifySemantics(token:Token,ctx:CompileContext,scope:Scope) {
		return this.root.test(token,1,{scope,ctx})
	}*/

}
