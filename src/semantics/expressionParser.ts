import { ASTNode, ASTNodeType, ASTOpNode } from "../syntax/AST"
import { SymbolTable } from "./SymbolTable"
import { Instruction, INT_OP, InstrType, INVOKE } from "./Instructions"
import { ESR, ESRType, IntESR, getESRType } from "./ESR"
import { DeclarationType } from "./Declaration"
import { ElementaryValueType, tokenToType, hasSharedType } from "./Types"
import { exhaust } from "../toolbox/other"
import { exec } from "child_process"
import { CompileContext } from "../toolbox/CompileContext"
import { Scope } from "./Scope"

export function exprParser(node: ASTNode, scope: Scope, body: Instruction[], ctx: CompileContext): ESR {

	let symbols = scope.symbols

	switch (node.type) {

		case ASTNodeType.IDENTIFIER: {
			let decl = symbols.getDeclaration(node.identifier)
			switch (decl.type) {
				case DeclarationType.IMPLICIT_VARIABLE:
					// fallthrough
				case DeclarationType.VARIABLE:
					let esr = decl.esr
					if (decl.varType.elementary) {
						switch (decl.varType.type) {
							case ElementaryValueType.INT:
								if (esr.type != ESRType.INT) return node.identifier.throwDebug('ESR type assertion failed')
								let res: IntESR = {type:ESRType.INT,mutable:true,const:false,tmp:true,scoreboard:esr.scoreboard}
								return res
							case ElementaryValueType.BOOL:
								return node.identifier.throwDebug('no bools rn')
							case ElementaryValueType.VOID:
								return node.identifier.throwDebug('void var type wtf?')
							default:
								return exhaust(decl.varType.type)
						}
					} else {
						return node.identifier.throwDebug('non-elementary ref not implemented')
					}
				case DeclarationType.FUNCTION:
						return node.identifier.throwDebug('non-invocation fn ref not implemented')
				default:
					return exhaust(decl)
			}
			throw new Error('should be unreachable?')
		}
			
		case ASTNodeType.PRIMITIVE:
			let val = node.value.value
			if (val == 'true') return {type:ESRType.BOOL,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(1)}
			if (val == 'false') return {type:ESRType.BOOL,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(0)}
			let n = Number(val)
			if (Number.isNaN(n)||!Number.isInteger(n)) node.value.throwDebug('kkk only int primitives')
			return {type:ESRType.INT,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(n)}

		case ASTNodeType.OPERATION:
			return operator(node,scope,body,ctx)

		case ASTNodeType.INVOKATION: {
			if (node.function.type != ASTNodeType.IDENTIFIER) throw new Error('only direct calls for now')
			let params = node.parameters.list.map(p=>exprParser(p,scope,body,ctx))
			let decl = symbols.getDeclaration(node.function.identifier.value)
			if (!decl) return node.function.identifier.throwDebug('fn not declared')
			if (decl.type != DeclarationType.FUNCTION)
				return node.function.identifier.throwDebug('not a fn')
			let paramTypes = decl.parameters.map(getESRType)
			if (params.length != paramTypes.length) return node.function.identifier.throwDebug('param length unmatched')
			for (let i = 0; i < params.length; i++) {
				let param = params[i]
				let esr = decl.parameters[i]
				if (!hasSharedType(getESRType(param),getESRType(esr))) node.function.identifier.throwDebug('param type mismatch')
				switch (esr.type) {
					case ESRType.BOOL:
						throw new Error('no impl')
					case ESRType.INT:
						let instr: INT_OP = {
							type: InstrType.INT_OP,
							from: param as IntESR,
							into: esr,
							op: '='
						}
						body.push(instr)
						break
					case ESRType.VOID:
						throw new Error(`this can't happen`)
					default:
						return exhaust(esr)
				}
			}
			let returnType = getESRType(decl.returns)
			let invokeInstr: INVOKE = {type:InstrType.INVOKE,fn:decl}
			if (returnType.elementary) {
				switch (returnType.type) {
					case ElementaryValueType.INT: {
						let into: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
						if (decl.returns.type != ESRType.INT) throw new Error('ESR error')
						let copyRet: INT_OP = {type:InstrType.INT_OP,into,from:decl.returns,op:'='}
						body.push(invokeInstr,copyRet)
						return into
					}
					case ElementaryValueType.VOID: {
						body.push(invokeInstr)
						return {type:ESRType.VOID,mutable:false,const:false,tmp:false}
					}
					case ElementaryValueType.BOOL:
						throw new Error('no bool ret rn')
					default:
						return exhaust(returnType.type)
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

function operator(node:ASTOpNode,scope:Scope,body:Instruction[],ctx:CompileContext) {
	let symbols = scope.symbols
	switch (node.operator.value) {
		case '+':
		case '-':
		case '*':
		case '/':
		case '%': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,body,ctx))
			if (o0.type != ESRType.INT) return node.operator.throwDebug('only int op for now')
			if (o0.type != o1.type) return node.operator.throwDebug('no op casting for now')
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
			// ???
			let op1: INT_OP = {type:InstrType.INT_OP,into:res,from:o0,op:'='}
			let op2: INT_OP = {type:InstrType.INT_OP,into:res,from:o1,op:node.operator.value+'='}
			body.push(op1,op2)
			return res
		}

		case '=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,body,ctx))
			if (!o0.mutable) throw new Error('left hand side immutable')
			if (o0.type != ESRType.INT) return node.operator.throwDebug('only int op for now')
			if (o0.type != o1.type) return node.operator.throwDebug('no op casting for now')
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
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
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,body,ctx))
			if (!o0.mutable) throw new Error('left hand side immutable')
			if (o0.type != ESRType.INT) return node.operator.throwDebug('only int op for now')
			if (o0.type != o1.type) return node.operator.throwDebug('no op casting for now')
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
			let op1: INT_OP = {type:InstrType.INT_OP,into:o0,from:o1,op:node.operator.value}
			let op2: INT_OP = {type:InstrType.INT_OP,into:res,from:o0,op:'='}
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
