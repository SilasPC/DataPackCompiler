import { ParsingFile } from "../lexing/ParsingFile"
import { hoist } from "./hoister"
import { ASTNode, ASTNodeType, ASTIdentifierNode, ASTPrimitiveNode, ASTCallNode,ASTOpNode } from "../syntax/AST"
import { SymbolTable } from "./SymbolTable"
import { ESR, ESRs } from "./ESR"
import { ValueType, tokenToType, ValueTypes, ElementaryValueType } from "./Types"
import { Declarations } from "./Declaration"
import { Lineal, Lineals } from "./Lineals"

export function parse(pfile:ParsingFile) {
	
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
					if (ValueTypes.is.ELEMENTARY(type) && type.type == ElementaryValueType.VOID)
						node.varType.throwDebug(`Cannot declare a variable of type 'void'`)
					let esr = exprParser(node.initial,symbols,load)
				}
				break
	
			case ASTNodeType.FUNCTION: {
					
				}
				break

			case ASTNodeType.IDENTIFIER:
			case ASTNodeType.INVOKATION:
			case ASTNodeType.OPERATION:
			case ASTNodeType.PRIMITIVE: {
					// expr parse
				}
				break

			case ASTNodeType.EXPORT:
			case ASTNodeType.COMMAND:
			case ASTNodeType.CONDITIONAL:
			case ASTNodeType.LIST:
					throw new Error('wth man')

			default:
				const exhaust: never = node
	
		}

	}

	pfile.status = 'parsed'

}

function parseBody(nodes:ASTNode[],symbols:SymbolTable,body:Lineal[]) {
	for (let node of nodes) {
		switch (node.type) {
			case ASTNodeType.COMMAND:
				// here we should probably parse the command
				body.push(Lineals.CMD({}))
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
				const exhaust: never = node
		}
	}
}

function exprParser(node:ASTNode,symbols:SymbolTable,body:Lineal[]): ESR {

	switch (node.type) {

		case ASTNodeType.IDENTIFIER:
			let idnode = node as ASTIdentifierNode
			let iddecl = symbols.getDeclaration(idnode.identifier.value)
			if (!iddecl) return idnode.identifier.throwDebug('Identifier undefined')
			Declarations.match(iddecl,{
				VARIABLE: ({type})=>{
					ValueTypes.match(type,{
						ELEMENTARY: type => {
							switch (type) {
								case ElementaryValueType.INT:
									return ESRs.SCORE({mutable:true,const:false,scoreboard:'test',selector:'test'})
								case ElementaryValueType.VOID:
									throw new Error('void var?')
								default:
									const exhuast: never = type
							}
						},
						NON_ELEMENTARY: () => {throw new Error('not implemented')}
					})
				},
				FUNCTION: ()=>{
					throw new Error('non-invocation fn ref not implemented')
				}
			})
			throw new Error('??')
			
		case ASTNodeType.PRIMITIVE:
			let val = node.value.value
			if (val == 'true') return ESRs.SCORE({mutable:false,const:true,scoreboard:'const',selector:'1'})
			if (val == 'false') return ESRs.SCORE({mutable:false,const:true,scoreboard:'const',selector:'0'})
			let n = Number(val)
			if (Number.isNaN(n)||!Number.isInteger(n)) node.value.throwDebug('kkk only int primitives')
			return ESRs.SCORE({mutable:false,const:true,scoreboard:'const',selector:val})

		case ASTNodeType.OPERATION:
			let operands = node.operands.map(o=>exprParser(o,symbols,body))
			switch (node.operator.value) {
				case '+':
				case '-':
				case '*':
				case '/':
				case '%':
					if (operands.length != 2) throw new Error('hmm')
					let [o0_1,o1_1] = operands.map(ESRs.as.SCORE)
					switch (node.operator.value) {
						case '+': body.push(Lineals.ADD_SCORE()); break
						case '-': body.push(Lineals.SUB_SCORE()); break
						case '*': body.push(Lineals.MULT_SCORE()); break
						case '/': body.push(Lineals.DIV_SCORE()); break
						case '%': body.push(Lineals.MOD_SCORE()); break
					}
					return ESRs.SCORE({mutable:false,const:false,scoreboard:'tmp',selector:'kkk'})
				
				case '+=':
				case '-=':
				case '*=':
				case '/=':
				case '%=':
					if (operands.length != 2) throw new Error('hmm')
					let [o0_2,o1_2] = operands.map(ESRs.as.SCORE)
					if (!o0_2.mutable) throw new Error('cannot mutate')
					switch (node.operator.value) {
						case '+=': body.push(Lineals.ADD_SCORE()); break
						case '-=': body.push(Lineals.SUB_SCORE()); break
						case '*=': body.push(Lineals.MULT_SCORE()); break
						case '/=': body.push(Lineals.DIV_SCORE()); break
						case '%=': body.push(Lineals.MOD_SCORE()); break
					}
					return ESRs.SCORE({mutable:false,const:false,scoreboard:'tmp',selector:'kkk'})

				case '&&':
				case '||':

				case '!':
				
				case '++':
				case '--':
				
				case '>':
				case '<':
				case '>=':
				case '<=':
				case '==':
				case '!=':

				default:
					throw new Error('i rly h8 boilerplate')
			}

		case ASTNodeType.INVOKATION:
			if (node.function.type != ASTNodeType.IDENTIFIER) throw new Error('only direct calls for now')
			let params = node.parameters.list.map(p=>exprParser(p,symbols,body))
			let fndecl = symbols.getDeclaration(node.function.identifier.value)
			if (!fndecl) return node.function.identifier.throwDebug('fn not declared')
			if (!Declarations.is.FUNCTION(fndecl)) return node.function.identifier.throwDebug('not a fn')
			// compare fndecl.node.parameters and params,
			// and add lineals to copy into params
			ValueTypes.match(fndecl.type,{
				ELEMENTARY: type => {
					switch (type) {
						case ElementaryValueType.INT:
							return ESRs.SCORE({mutable:false,const:false,scoreboard:'static',selector:'fnret'})
						case ElementaryValueType.VOID:
							return ESRs.VOID()
						default:
							const exhuast: never = type
					}
				},
				NON_ELEMENTARY: ()=>{throw new Error('nop')}
			})

		// Invalid cases. These should never occur
		case ASTNodeType.CONDITIONAL:
		case ASTNodeType.DEFINE:
		case ASTNodeType.EXPORT:
		case ASTNodeType.FUNCTION:
		case ASTNodeType.COMMAND:
		case ASTNodeType.LIST:
			throw new Error('ohkayy')

	}

	const exhuast: never = node

}
