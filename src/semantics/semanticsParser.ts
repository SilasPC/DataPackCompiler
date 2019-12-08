import { ParsingFile } from "../lexing/ParsingFile"
import { hoist } from "./hoister"
import { ASTNode, ASTNodeType, ASTOpNode } from "../syntax/AST"
import { SymbolTable } from "./SymbolTable"
import { ESR, ESRType, getESRType, IntESR } from "./ESR"
import { tokenToType, ElementaryValueType, ValueType, hasSharedType } from "./Types"
import { DeclarationType, VarDeclaration, FnDeclaration } from "./Declaration"
import { Lineal, LinealType, INT_OP } from "./Lineals"
import { exprParser } from "./expressionParser"
import { exhaust } from "../toolbox/other"

export function semanticsParser(pfile:ParsingFile): void {
	
	if (pfile.status == 'parsed') return
	if (pfile.status == 'parsing') throw new Error('circular parsing')

	pfile.status = 'parsing'

	let symbols = pfile.getSymbolTable()
	let ast = pfile.getAST() as ASTNode[]

	let load: Lineal[] = []
	
	for (let node of ast) {
		let shouldExport = false

		if (node.type == ASTNodeType.EXPORT) node = node.node

		switch (node.type) {

			case ASTNodeType.DEFINE: {
					let type = tokenToType(node.varType,symbols)
					if (type.elementary && type.type == ElementaryValueType.VOID)
						node.varType.throwDebug(`Cannot declare a variable of type 'void'`)
					if (!type.elementary) node.varType.throwDebug('no non-elemn rn k')
					let esr = exprParser(node.initial,symbols,load)
					getESRType(esr)
					if (!hasSharedType(getESRType(esr),type)) node.identifier.throwDebug('type mismatch')
					let decl: VarDeclaration = {type: DeclarationType.VARIABLE,varType:type,node}
					symbols.declare(node.identifier,decl)
					break
				}
	
			case ASTNodeType.FUNCTION: {
					let body: Lineal[] = []
					let decl: FnDeclaration = {type:DeclarationType.FUNCTION,returnType:tokenToType(node.returnType,symbols),node}
					symbols.declare(node.identifier,decl)
					parseBody(node.body,symbols.branch(),body)
					console.log(node.identifier.value,body)
					break
				}

			case ASTNodeType.IDENTIFIER:
			case ASTNodeType.INVOKATION:
			case ASTNodeType.OPERATION:
			case ASTNodeType.PRIMITIVE:
			case ASTNodeType.EXPORT:
			case ASTNodeType.COMMAND:
			case ASTNodeType.CONDITIONAL:
			case ASTNodeType.LIST:
					throw new Error('wth man')

			default:
				return exhaust(node)
	
		}

	}

	pfile.status = 'parsed'

}

function parseBody(nodes:ASTNode[],symbols:SymbolTable,body:Lineal[]): void {
	for (let node of nodes) {
		switch (node.type) {
			case ASTNodeType.COMMAND:
				// here we should probably parse the command
				body.push({type:LinealType.CMD})
				break
			case ASTNodeType.INVOKATION:
			case ASTNodeType.OPERATION:
				exprParser(node,symbols,body)
				break
			case ASTNodeType.PRIMITIVE:
			case ASTNodeType.IDENTIFIER:
				throw new Error('valid, but pointless')
			case ASTNodeType.CONDITIONAL:
			case ASTNodeType.DEFINE:
				throw new Error('not implemented')
			case ASTNodeType.LIST:
			case ASTNodeType.FUNCTION:
			case ASTNodeType.EXPORT:
				throw new Error('invalid ast structure')
			default:
				return exhaust(node)
		}
	}
}
