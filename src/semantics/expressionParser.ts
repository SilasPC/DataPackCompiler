import { ASTNode, ASTNodeType, ASTOpNode } from "../syntax/AST"
import { SymbolTable } from "./SymbolTable"
import { Instruction, INT_OP, InstrType, INVOKE } from "../codegen/Instructions"
import { ESR, ESRType, IntESR, getESRType } from "./ESR"
import { DeclarationType } from "./Declaration"
import { ElementaryValueType, tokenToType, hasSharedType } from "./Types"
import { exhaust } from "../toolbox/other"
import { exec } from "child_process"
import { CompileContext } from "../toolbox/CompileContext"
import { Scope } from "./Scope"
import { Possible, CompileErrorSet, CompileError } from "../toolbox/CompileErrors"

export function exprParser(node: ASTNode, scope: Scope, ctx: CompileContext): Possible<ESR> {

	const err = new CompileErrorSet()

	let symbols = scope.symbols

	switch (node.type) {

		case ASTNodeType.IDENTIFIER: {
			let possibleDecl = symbols.getDeclaration(node.identifier)
			if (!err.checkHasValue(possibleDecl)) return err
			let decl = possibleDecl.value
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
								return err.wrap(res)
							case ElementaryValueType.BOOL:
								return err.push(node.identifier.error('no bools rn'))
							case ElementaryValueType.VOID:
								return err.push(node.identifier.error('void var type wtf?'))
							default:
								return exhaust(decl.varType.type)
						}
					} else {
						return err.push(node.identifier.error('non-elementary ref not implemented'))
					}
				case DeclarationType.FUNCTION:
						return err.push(node.identifier.error('non-invocation fn ref not implemented'))
				default:
					return exhaust(decl)
			}
			throw new Error('should be unreachable?')
		}
		
		case ASTNodeType.BOOLEAN: {
			if (node.value.value == 'true')
				return err.wrap({type:ESRType.BOOL,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(1)})
			if (node.value.value == 'false')
				return err.wrap({type:ESRType.BOOL,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(0)})
		}

		case ASTNodeType.NUMBER: {
			let n = Number(node.value.value)
			if (Number.isNaN(n)||!Number.isInteger(n)) return err.push(node.value.error('kkk only int primitives'))
			return err.wrap<ESR>({type:ESRType.INT,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(n)})
		}

		case ASTNodeType.OPERATION:
			return err.wrap(operator(node,scope,ctx))

		case ASTNodeType.INVOKATION: {
			if (node.function.type != ASTNodeType.IDENTIFIER) throw new Error('only direct calls for now')
			let params = node.parameters.list.map(p=>exprParser(p,scope,ctx))
			params.forEach(
				p => p instanceof CompileErrorSet ? err.merge(p) : null
			)
			let decl = symbols.getDeclaration(node.function.identifier.value)
			if (!decl) return err.push(node.function.identifier.error('fn not declared'))
			if (decl.type != DeclarationType.FUNCTION)
				return err.push(node.function.identifier.error('not a fn'))
			let paramTypes = decl.parameters.map(getESRType)
			if (params.length != paramTypes.length) return err.push(node.function.identifier.error('param length unmatched'))
			for (let i = 0; i < params.length; i++) {
				let param = params[i]
				if (!param.hasValue()) continue
				let esr = decl.parameters[i]
				if (!hasSharedType(getESRType(param.value),getESRType(esr))) {
					err.push(node.function.identifier.throwDebug('param type mismatch'))
					continue
				}
				switch (esr.type) {
					case ESRType.BOOL:
						throw new Error('no impl')
					case ESRType.INT:
						let instr: INT_OP = {
							type: InstrType.INT_OP,
							from: param.value as IntESR,
							into: esr,
							op: '='
						}
						scope.push(instr)
						break
					case ESRType.VOID:
						throw new Error(`this can't happen`)
					default:
						return exhaust(esr)
				}
			}
			let returnType = getESRType(decl.returns)
			let invokeInstr: INVOKE = {type:InstrType.INVOKE,fn:decl.fn}
			if (returnType.elementary) {
				switch (returnType.type) {
					case ElementaryValueType.INT: {
						let into: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
						if (decl.returns.type != ESRType.INT) throw new Error('ESR error')
						let copyRet: INT_OP = {type:InstrType.INT_OP,into,from:decl.returns,op:'='}
						scope.push(invokeInstr,copyRet)
						return err.wrap(into)
					}
					case ElementaryValueType.VOID: {
						scope.push(invokeInstr)
						return err.wrap({type:ESRType.VOID,mutable:false,const:false,tmp:false})
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

		case ASTNodeType.STRING:
			throw new Error('no strings in expressions for now I guess')

		// Invalid cases. These should never occur
		case ASTNodeType.CONDITIONAL:
		case ASTNodeType.RETURN:
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

function operator(node:ASTOpNode,scope:Scope,ctx:CompileContext): Possible<IntESR> {
	const err = new CompileErrorSet()
	switch (node.operator.value) {
		case '+':
		case '-':
		case '*':
		case '/':
		case '%': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,ctx))
			err.checkHasValue(o0)
			err.checkHasValue(o1)
			if (!o0.hasValue() || !o1.hasValue()) return err
			if (o0.value.type != ESRType.INT) return node.operator.throwDebug('only int op for now')
			if (o0.value.type != o1.value.type) return node.operator.throwDebug('no op casting for now')
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
			// ???
			let op1: INT_OP = {type:InstrType.INT_OP,into:res,from:o0.value,op:'='}
			let op2: INT_OP = {type:InstrType.INT_OP,into:res,from:o1.value,op:node.operator.value+'='}
			scope.push(op1,op2)
			return err.wrap(res)
		}

		case '=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,ctx))
			err.checkHasValue(o0)
			err.checkHasValue(o1)
			if (!o0.hasValue() || !o1.hasValue()) return err
			if (!o0.value.mutable) throw new Error('left hand side immutable')
			if (o0.value.type != ESRType.INT) return node.operator.throwDebug('only int op for now')
			if (o0.value.type != o1.value.type) return node.operator.throwDebug('no op casting for now')
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
			let op: INT_OP = {type:InstrType.INT_OP,into:res,from:o1.value,op:'='}
			scope.push(op)
			return err.wrap(res)
		}
		
		case '+=':
		case '-=':
		case '*=':
		case '/=':
		case '%=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,ctx))
			err.checkHasValue(o0)
			err.checkHasValue(o1)
			if (!o0.hasValue() || !o1.hasValue()) return err
			if (!o0.value.mutable) throw new Error('left hand side immutable')
			if (o0.value.type != ESRType.INT) return node.operator.throwDebug('only int op for now')
			if (o0.value.type != o1.value.type) return node.operator.throwDebug('no op casting for now')
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
			let op1: INT_OP = {type:InstrType.INT_OP,into:o0.value,from:o1.value,op:node.operator.value}
			let op2: INT_OP = {type:InstrType.INT_OP,into:res,from:o0.value,op:'='}
			scope.push(op1,op2)
			return err.wrap(res)
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
			return err.push(new CompileError('i rly h8 boilerplate'))
	}
	throw new Error('unreachable')
}
