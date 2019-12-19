import { ASTNode, ASTNodeType, ASTOpNode } from "../syntax/AST"
import { SymbolTable } from "./SymbolTable"
import { Instruction, INT_OP, InstrType, INVOKE_INT, INVOKE_VOID } from "./Instructions"
import { ESR, ESRType, IntESR, getESRType } from "./ESR"
import { DeclarationType } from "./Declaration"
import { ElementaryValueType, tokenToType, hasSharedType } from "./Types"
import { exhaust } from "../toolbox/other"

export function exprParser(node:ASTNode,symbols:SymbolTable,body:Instruction[]): ESR {

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

		case ASTNodeType.INVOKATION: {
			if (node.function.type != ASTNodeType.IDENTIFIER) throw new Error('only direct calls for now')
			let params = node.parameters.list.map(p=>exprParser(p,symbols,body))
			let decl = symbols.getDeclaration(node.function.identifier.value)
			if (!decl) return node.function.identifier.throwDebug('fn not declared')
			if (decl.type != DeclarationType.FUNCTION)
				return node.function.identifier.throwDebug('not a fn')
			let paramTypes = decl.node.parameters.map(({type})=>tokenToType(type,symbols))
			if (params.length != paramTypes.length) return node.function.identifier.throwDebug('param length unmatched')
			for (let i = 0; i < params.length; i++) {
				let param = params[i]
				let type = paramTypes[i]
				if (!hasSharedType(getESRType(param),type)) node.function.identifier.throwDebug('param type mismatch')
				// TODO: add instructions to copy into param
			}
			if (decl.returnType.elementary) {
				switch (decl.returnType.type) {
					case ElementaryValueType.INT: {
						let into: IntESR = {type:ESRType.INT,mutable:false,const:false,scoreboard:{}}
						let instr: INVOKE_INT = {type:InstrType.INVOKE_INT,fn:decl,into}
						body.push(instr)
						return into
					}
					case ElementaryValueType.VOID: {
						let instr: INVOKE_VOID = {type:InstrType.INVOKE_VOID,fn:decl}
						body.push(instr)
						return {type:ESRType.VOID,mutable:false,const:false}
					}
					case ElementaryValueType.BOOL:
						throw new Error('no bool ret rn')
					default:
						return exhaust(decl.returnType.type)
				}
			} else {
				throw new Error('non elementary return value not supported yet')
			}
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

function operator(node:ASTOpNode,symbols:SymbolTable,body:Instruction[]) {
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
			let op1: INT_OP = {type:InstrType.INT_OP,into:res,from:o0,op:'='}
			let op2: INT_OP = {type:InstrType.INT_OP,into:res,from:o1,op:node.operator.value+'='}
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
			let op: INT_OP = {type:InstrType.INT_OP,into:res,from:o1,op:'='}
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
			let op1: INT_OP = {type:InstrType.INT_OP,into:res,from:o0,op:'='}
			let op2: INT_OP = {type:InstrType.INT_OP,into:res,from:o1,op:node.operator.value}
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
