
import { ParsingFile } from "../lexing/ParsingFile";
import { ASTNodeType, ASTFnNode, ASTLetNode } from "../syntax/AST";
import { Declaration, Declarations } from "./Declaration";

export function hoist(pfile:ParsingFile) {

	let symbols = pfile.getSymbolTable()
	let ast = pfile.getAST()

	for (let node of ast) {
		let shouldExport = false

		switch (node.type) {

			case ASTNodeType.EXPORT:
				shouldExport = true

			case ASTNodeType.FUNCTION:
				let fnnode = node as ASTFnNode
				let fndecl: FnDeclaration = {
					type: DeclarationType.FUNCTION,
					node: node as ASTFnNode,
					identifier: generateIdentifier()
				}
				symbols.declare(fnnode.identifier,fndecl)
				break

			case ASTNodeType.DEFINE:
				let defnode = node as ASTLetNode
				let vardecl: VarDeclaration = {
					type: DeclarationType.VARIABLE,
					node: defnode,
					identifier: generateIdentifier()
				}
				symbols.declare(defnode.identifier,vardecl)
				break

			default:
				const exhaust: never = node

		}

	}

}
