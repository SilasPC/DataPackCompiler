import { ASTNode, ASTNodeType, ASTOpNode } from "../syntax/AST"
import { SymbolTable } from "./SymbolTable"
import { Lineal, INT_OP, LinealType } from "./Lineals"
import { ESR, ESRType, IntESR } from "./ESR"
import { DeclarationType } from "./Declaration"
import { ElementaryValueType } from "./Types"
import { exhaust } from "../toolbox/other"

export function exprParser(node:ASTNode,symbols:SymbolTable,body:Lineal[]): ESR {

	switch (node.type) {

		case ASTNodeType.IDENTIFIER: {
			let iddecl = symbols.getDeclaration(node.identifier)
			switch (iddecl.type) {
				case DeclarationType.VARIABLE:
					if (iddecl.varType.elementary) {
						switch (iddecl.varType.type) {
							case ElementaryValueType.INT:
								let res: IntESR = {type:ESRType.INT,mutable:true,const:false,scoreboard:{}}
								return res
							case ElementaryValueType.BOOL:
								return node.identifier.throwDebug('no bools rn')
							case ElementaryValueType.VOID:
								return node.identifier.throwDebug('void var type wtf?')
							default:
								return exhaust(iddecl.varType.type)
						}
					} else {
						return node.identifier.throwDebug('non-elementary ref not implemented')
					}
				case DeclarationType.FUNCTION:
						return node.identifier.throwDebug('non-invocation fn ref not implemented')
				default:
					return exhaust(iddecl)
			}
			throw new Error('should be unreachable?')
		}
			
		case ASTNodeType.PRIMITIVE:
			let val = node.value.value
			if (val == 'true') return {type:ESRType.BOOL,mutable:false,const:true,scoreboard:{}}
			if (val == 'false') return {type:ESRType.BOOL,mutable:false,const:true,scoreboard:{}}
			let n = Number(val)
			if (Number.isNaN(n)||!Number.isInteger(n)) node.value.throwDebug('kkk only int primitives')
			return {type:ESRType.INT,mutable:false,const:true,scoreboard:{}}

		case ASTNodeType.OPERATION:
			return operator(node,symbols,body)

		case ASTNodeType.INVOKATION:
			if (node.function.type != ASTNodeType.IDENTIFIER) throw new Error('only direct calls for now')
			let params = node.parameters.list.map(p=>exprParser(p,symbols,body))
			let fndecl = symbols.getDeclaration(node.function.identifier.value)
			if (!fndecl) return node.function.identifier.throwDebug('fn not declared')
			if (fndecl.type != DeclarationType.FUNCTION)
				return node.function.identifier.throwDebug('not a fn')
			// compare fndecl.node.parameters and params,
			// and add lineals to copy into params
			if (fndecl.returnType.elementary) {
				switch (fndecl.returnType.type) {
					case ElementaryValueType.INT:
						return {type:ESRType.INT,mutable:false,const:false,scoreboard:{}}
					case ElementaryValueType.VOID:
						return {type:ESRType.VOID,mutable:false,const:false}
					case ElementaryValueType.BOOL:
						throw new Error('no bool ret rn')
					default:
						return exhaust(fndecl.returnType.type)
				}
			} else {
				throw new Error('non elementary return value not supported yet')
			}

		// Invalid cases. These should never occur
		case ASTNodeType.CONDITIONAL:
		case ASTNodeType.DEFINE:
		case ASTNodeType.EXPORT:
		case ASTNodeType.FUNCTION:
		case ASTNodeType.COMMAND:
		case ASTNodeType.LIST:
			throw new Error('ohkayy')
		
		default:
			return exhaust(node)

	}

}

function operator(node:ASTOpNode,symbols:SymbolTable,body:Lineal[]) {
	switch (node.operator.value) {
		case '+':
		case '-':
		case '*':
		case '/':
		case '%': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,symbols,body))
			if (o0.type != ESRType.INT) return node.operator.throwDebug('only int op for now')
			if (o0.type != o1.type) return node.operator.throwDebug('no op casting for now')
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,scoreboard:{}}
			// ???
			let op1: INT_OP = {type:LinealType.INT_OP,into:res,from:o0,op:'='}
			let op2: INT_OP = {type:LinealType.INT_OP,into:res,from:o1,op:node.operator.value+'='}
			body.push(op1,op2)
			return res
		}

		case '=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,symbols,body))
			if (!o0.mutable) throw new Error('left hand side immutable')
			if (o0.type != ESRType.INT) return node.operator.throwDebug('only int op for now')
			if (o0.type != o1.type) return node.operator.throwDebug('no op casting for now')
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,scoreboard:{}}
			let op: INT_OP = {type:LinealType.INT_OP,into:res,from:o1,op:'='}
			body.push(op)
			return res
		}
		
		case '+=':
		case '-=':
		case '*=':
		case '/=':
		case '%=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,symbols,body))
			if (!o0.mutable) throw new Error('left hand side immutable')
			if (o0.type != ESRType.INT) return node.operator.throwDebug('only int op for now')
			if (o0.type != o1.type) return node.operator.throwDebug('no op casting for now')
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,scoreboard:{}}
			let op1: INT_OP = {type:LinealType.INT_OP,into:res,from:o0,op:'='}
			let op2: INT_OP = {type:LinealType.INT_OP,into:res,from:o1,op:node.operator.value}
			body.push(op1,op2)
			return res
		}

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
	throw new Error('unreachable')
}
