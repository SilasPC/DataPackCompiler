
import { ParsingFile } from "../lexing/ParsingFile";
import { Datapack } from "./Datapack";
import { SymbolTable } from "../semantics/SymbolTable";
import { FnFile } from "./FnFile";
import { ASTNodeType, ASTCmdNode, ASTOpNode, ASTIfNode, ASTNode } from "../syntax/AST";

export function generateCode(pfile:ParsingFile,datapack:Datapack) {

	for (let decl of SymbolTable.getAllDeclarations()) {

		switch (decl.type) {

			case DeclarationType.FUNCTION:
				let fndecl: FnDeclaration = decl as FnDeclaration
				generateFunction(fndecl,datapack)
				break
			
			case DeclarationType.VARIABLE:
				let vardecl: VarDeclaration = decl as VarDeclaration
				datapack.addLoadCode(
					`scoreboard objectives add ${vardecl.identifier} dummy`
				)
				break

			default:
				const exhaust: never = decl.type

		}

	}

	pfile.status = 'generated'

}

function generateFunction(fn:FnDeclaration,dp:Datapack) {

	let fnf = new FnFile(fn.identifier)
	
	for (let node of fn.node.body) {

		switch (node.type) {

			case ASTNodeType.COMMAND:
				let cmdnode = node as ASTCmdNode
				fnf.addLines(cmdnode.cmd)
				break

			case ASTNodeType.CONDITIONAL:
				let ifnode = node as ASTIfNode
				generateExpression(ifnode.expression,fnf,dp)
				break
			
			case ASTNodeType.OPERATION:
				generateExpression(node,fnf,dp);
				break

			default:
				throw 'hello hello hello'
				// const exhaust: never = node.type

		}

	}

	dp.addFnFile(fnf)

}

function generateExpression(node:ASTNode,fnf:FnFile,dp:Datapack) {

	// recursively generate code

}
