import { ASTNode, ASTNodeType, ASTOpNode } from "../syntax/AST"
import { SymbolTable } from "./SymbolTable"
import { Instruction, INT_OP, InstrType, INVOKE } from "../codegen/Instructions"
import { ESR, ESRType, IntESR, getESRType } from "./ESR"
import { DeclarationType } from "./Declaration"
import { ElementaryValueType, hasSharedType } from "./Types"
import { exhaust } from "../toolbox/other"
import { CompileContext } from "../toolbox/CompileContext"
import { Scope } from "./Scope"
import { Maybe } from "../toolbox/Maybe"
import { MaybeWrapper } from "../toolbox/Maybe"
import { CompileError } from "../toolbox/CompileErrors"

export function exprParser(node: ASTNode, scope: Scope, ctx: CompileContext): Maybe<ESR> {

	let maybe = new MaybeWrapper<ESR>()

	let symbols = scope.symbols

	switch (node.type) {

		case ASTNodeType.IDENTIFIER: {
			let possibleDecl = symbols.getDeclaration(node.identifier,ctx)
			if (!possibleDecl.value) return maybe.none()
			let {token,decl} = possibleDecl.value
			switch (decl.type) {
				case DeclarationType.VARIABLE: {
					let esr = decl.esr
					if (decl.varType.elementary) {
						switch (decl.varType.type) {
							case ElementaryValueType.INT:
								if (esr.type != ESRType.INT) return token.throwDebug('ESR type assertion failed')
								let res: IntESR = {type:ESRType.INT,mutable:true,const:false,tmp:true,scoreboard:esr.scoreboard}
								return maybe.wrap(res)
							case ElementaryValueType.BOOL:
								ctx.addError(token.error('no bools rn'))
								return maybe.none()
							case ElementaryValueType.VOID:
								throw new Error('this can\'t happen')
							default:
								return exhaust(decl.varType.type)
						}
					} else {
						ctx.addError(token.error('non-elementary ref not implemented'))
						return maybe.none()
					}
				}
				case DeclarationType.FUNCTION:
						ctx.addError(token.error('non-invocation fn ref not implemented'))
						return maybe.none()
				default:
					return exhaust(decl)
			}
		}
		
		case ASTNodeType.BOOLEAN: {
			if (node.value.value == 'true')
				return maybe.wrap({type:ESRType.BOOL,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(1)})
			if (node.value.value == 'false')
				return maybe.wrap({type:ESRType.BOOL,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(0)})
			throw new Error('kkk')
		}

		case ASTNodeType.NUMBER: {
			let n = Number(node.value.value)
			if (Number.isNaN(n)||!Number.isInteger(n)) {
				ctx.addError(node.value.error('kkk only int primitives'))
				return maybe.none()
			}
			return maybe.wrap({type:ESRType.INT,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(n)})
		}

		case ASTNodeType.OPERATION:
			return operator(node,scope,ctx)

		case ASTNodeType.INVOKATION: {
			if (node.function.type != ASTNodeType.IDENTIFIER) throw new Error('only direct calls for now')
			let params = node.parameters.list.map(p=>exprParser(p,scope,ctx))
			let declw = symbols.getDeclaration(node.function.identifier.value)
			if (!declw) {
				ctx.addError(node.function.identifier.error('fn not declared'))
				return maybe.none()
			}
			let decl = declw.decl
			if (decl.type != DeclarationType.FUNCTION) {
				ctx.addError(node.function.identifier.error('not a fn'))
				return maybe.none()
			}
			let paramTypes = decl.parameters.map(getESRType)
			if (params.length != paramTypes.length) {
				ctx.addError(node.function.identifier.error('param length unmatched'))
				return maybe.none()
			}
			for (let i = 0; i < params.length; i++) {
				let param = params[i]
				if (!param.value) continue
				let esr = decl.parameters[i]
				if (!hasSharedType(getESRType(param.value),getESRType(esr))) {
					ctx.addError(node.function.identifier.error('param type mismatch'))
					maybe.noWrap()
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
						return maybe.wrap(into)
					}
					case ElementaryValueType.VOID: {
						scope.push(invokeInstr)
						return maybe.wrap({type:ESRType.VOID,mutable:false,const:false,tmp:false})
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

function operator(node:ASTOpNode,scope:Scope,ctx:CompileContext): Maybe<IntESR> {
	const maybe = new MaybeWrapper<IntESR>()
	switch (node.operator.value) {
		case '+':
		case '-':
		case '*':
		case '/':
		case '%': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,ctx))
			if (!o0.value || !o1.value)
				return maybe.none()
			if (o0.value.type != ESRType.INT) {
				ctx.addError(node.operator.error('only int op for now'))
				return maybe.none()
			}
			if (o0.value.type != o1.value.type) {
				ctx.addError(node.operator.error('no cast for now'))
				return maybe.none()
			}
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
			// ???
			let op1: INT_OP = {type:InstrType.INT_OP,into:res,from:o0.value,op:'='}
			let op2: INT_OP = {type:InstrType.INT_OP,into:res,from:o1.value,op:node.operator.value+'='}
			scope.push(op1,op2)
			return maybe.wrap(res)
		}

		case '=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,ctx))
			if (!o0.value || !o1.value)
				return maybe.none()
			if (!o0.value.mutable) {
				ctx.addError(node.operator.error('left hand side immutable'))
				return maybe.none()
			}
			if (o0.value.type != ESRType.INT) {
				ctx.addError(node.operator.error('only int op for now'))
				return maybe.none()
			}
			if (o0.value.type != o1.value.type) {
				ctx.addError(node.operator.error('no cast for now'))
				return maybe.none()
			}
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
			let op: INT_OP = {type:InstrType.INT_OP,into:res,from:o1.value,op:'='}
			scope.push(op)
			return maybe.wrap(res)
		}
		
		case '+=':
		case '-=':
		case '*=':
		case '/=':
		case '%=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,ctx))
			if (!o0.value || !o1.value)
				return maybe.none()
			if (!o0.value.mutable) {
				ctx.addError(node.operator.error('left hand side immutable'))
				return maybe.none()
			}
			if (o0.value.type != ESRType.INT) {
				ctx.addError(node.operator.error('only int op for now'))
				return maybe.none()
			}
			if (o0.value.type != o1.value.type) {
				ctx.addError(node.operator.error('no cast for now'))
				return maybe.none()
			}
			let res: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
			let op1: INT_OP = {type:InstrType.INT_OP,into:o0.value,from:o1.value,op:node.operator.value}
			let op2: INT_OP = {type:InstrType.INT_OP,into:res,from:o0.value,op:'='}
			scope.push(op1,op2)
			return maybe.wrap(res)
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
			ctx.addError(new CompileError('i rly h8 boilerplate',false))
			return maybe.none()
	}
}
