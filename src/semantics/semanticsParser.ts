import { ParsingFile } from "../lexing/ParsingFile"
// import { hoist } from "./hoister"
import { ASTNode, ASTNodeType, ASTOpNode } from "../syntax/AST"
import { SymbolTable } from "./SymbolTable"
import { ESR, ESRType, getESRType, IntESR } from "./ESR"
import { tokenToType, ElementaryValueType, ValueType, hasSharedType } from "./Types"
import { DeclarationType, VarDeclaration, FnDeclaration } from "./Declaration"
import { Instruction, InstrType, INT_OP } from "./Instructions"
import { exprParser } from "./expressionParser"
import { exhaust } from "../toolbox/other"
import { CompileContext } from "../toolbox/CompileContext"
import { generateTest } from "../codegen/generate"

export function semanticsParser(pfile:ParsingFile,ctx:CompileContext): void {
	
	if (pfile.status == 'parsed') return
	if (pfile.status == 'parsing') throw new Error('circular parsing')

	pfile.status = 'parsing'

	let symbols = pfile.getSymbolTable()
	let ast = pfile.getAST() as ASTNode[]

	let load: Instruction[] = []
	
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
					if (shouldExport) pfile.addExport(node.identifier.value,decl)
					break
				}
	
			case ASTNodeType.FUNCTION: {
					let body: Instruction[] = []
					let parameters: ESR[] = []
					for (let param of node.parameters) {
						let type = tokenToType(param.type,symbols)
						if (!type.elementary) return param.type.throwDebug('elementary only thx')
						switch (type.type) {
							case ElementaryValueType.VOID:
								return param.type.throwDebug('not valid')
							case ElementaryValueType.INT:
								let esr: IntESR = {
									type: ESRType.INT,
									scoreboard: {},
									mutable: false, // this controls if function parameters are mutable
									const: false
								}
								parameters.push(esr)
								break
							case ElementaryValueType.BOOL:
								return param.type.throwDebug('no bool yet thx')
							default:
								return exhaust(type.type)
						}
					}
					let type = tokenToType(node.returnType,symbols)
					if (!type.elementary) return node.returnType.throwDebug('nop thx')
					let esr: ESR
					switch (type.type) {
						case ElementaryValueType.VOID:
							esr = {type:ESRType.VOID, mutable: false, const: false}
							break
						case ElementaryValueType.INT:
							esr = {type:ESRType.INT, mutable: false, const: false, scoreboard: {}}
							break
						case ElementaryValueType.BOOL:
							esr = {type:ESRType.BOOL, mutable: false, const: false, scoreboard: {}}
							break
						default:
							return exhaust(type.type)
					}
					let decl: FnDeclaration = {
						type: DeclarationType.FUNCTION,
						returns: esr,
						node,
						instructions: body,
						parameters
					}
					symbols.declare(node.identifier,decl)
					if (shouldExport) pfile.addExport(node.identifier.value,decl)
					parseBody(node.body,symbols.branch(),body)
					console.log(node.identifier.value)
					console.log(generateTest(decl,ctx))
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

function parseBody(nodes:ASTNode[],symbols:SymbolTable,body:Instruction[]): void {
	for (let node of nodes) {
		switch (node.type) {
			case ASTNodeType.COMMAND:
				// here we should probably parse the command
				body.push({type:InstrType.CMD})
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
