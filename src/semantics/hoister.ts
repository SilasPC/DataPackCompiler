
import { ParsingFile } from "../lexing/ParsingFile";
import { ASTNodeType, ASTFnNode, ASTLetNode } from "../syntax/AST";
import { Declaration, FnDeclaration, DeclarationType, VarDeclaration } from "./Declaration";
import { tokenToType } from "./Types";
import { exhaust } from "../toolbox/other";

export function hoist(pfile:ParsingFile) {

	let symbols = pfile.getSymbolTable()
	let ast = pfile.getAST()

	for (let node of ast) {
		let shouldExport = false

		if (node.type == ASTNodeType.EXPORT) {
			shouldExport = true
			node = node.node
		}

		switch (node.type) {

			case ASTNodeType.EXPORT:
				throw new Error('invalid ast structure')

			case ASTNodeType.FUNCTION:
				let fndecl: FnDeclaration = {
					type: DeclarationType.FUNCTION,
					node: node,
					returnType: tokenToType(node.returnType,symbols)
				}
				symbols.declare(node.identifier,fndecl)
				pfile.addExport(node.identifier.value,fndecl)
				break

			case ASTNodeType.DEFINE:
				let vardecl: VarDeclaration = {
					type: DeclarationType.VARIABLE,
					node: node,
					varType: tokenToType(node.varType,symbols)
				}
				symbols.declare(node.identifier,vardecl)
				pfile.addExport(node.identifier.value,vardecl)
				break
			
			case ASTNodeType.COMMAND:
			case ASTNodeType.CONDITIONAL:
			case ASTNodeType.IDENTIFIER:
			case ASTNodeType.INVOKATION:
			case ASTNodeType.LIST:
			case ASTNodeType.OPERATION:
			case ASTNodeType.PRIMITIVE:
				throw new Error('invalid ast structure in hoisting')

			default:
				return exhaust(node)
		}

	}

}
