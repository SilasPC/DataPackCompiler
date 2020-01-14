import { ASTNode, ASTNodeType, ASTOpNode, ASTExpr, astErrorMsg, ASTCallNode, astError } from "../syntax/AST"
import { SymbolTable } from "./SymbolTable"
import { Instruction, INT_OP, InstrType, INVOKE } from "../codegen/Instructions"
import { ESR, ESRType, IntESR, getESRType, assignESR, copyESR } from "./ESR"
import { DeclarationType, Declaration } from "./Declaration"
import { ElementaryValueType, hasSharedType } from "./Types"
import { exhaust } from "../toolbox/other"
import { CompileContext } from "../toolbox/CompileContext"
import { Scope } from "./Scope"
import { Maybe } from "../toolbox/Maybe"
import { MaybeWrapper } from "../toolbox/Maybe"
import { CompileError } from "../toolbox/CompileErrors"
import { resolveStatic } from "./resolveStatic"

export function exprParser(node: ASTExpr, scope: Scope, ctx: CompileContext, evalOnly:boolean): Maybe<ESR> {

	let maybe = new MaybeWrapper<ESR>()

	let symbols = scope.symbols

	switch (node.type) {

		case ASTNodeType.STATIC_ACCESS:
		case ASTNodeType.IDENTIFIER: {
			let possibleDecl = resolveStatic(node,scope,ctx)
			if (!possibleDecl.value) return maybe.none()
			let {token,decl} = possibleDecl.value
			switch (decl.type) {
				case DeclarationType.VARIABLE: {
					let esr = decl.esr
					// does this break things?
					return maybe.wrap(esr)
					/*if (decl.varType.elementary) {
						switch (decl.varType.type) {
							case ElementaryValueType.INT:
								if (esr.type != ESRType.INT) return token.throwDebug('ESR type assertion failed')
								let res: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:esr.scoreboard}
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
					}*/
				}
				case DeclarationType.FUNCTION:
						ctx.addError(token.error('cannot use function as variable'))
						return maybe.none()
				case DeclarationType.MODULE:
					ctx.addError(token.error('cannot use module as variable'))
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
			return operator(node,scope,ctx,evalOnly)

		case ASTNodeType.INVOKATION:
			return invokation(node,scope,ctx,evalOnly,maybe)

		case ASTNodeType.STRING:
			ctx.addError(node.value.error('no strings in expressions for now I guess'))
			return maybe.none()

		case ASTNodeType.LIST:
			ctx.addError(new CompileError(astErrorMsg(node,'no lists in expr yet'),false))
			return maybe.none()

		case ASTNodeType.REFERENCE:
			ctx.addError(node.keyword.error('unexpected keyword'))
			return maybe.none()

		default:
			return exhaust(node)

	}

}

function invokation(node:ASTCallNode,scope:Scope,ctx:CompileContext,evalOnly:boolean,maybe:MaybeWrapper<ESR>) {
	const symbols = scope.symbols
	if (node.function.type != ASTNodeType.IDENTIFIER && node.function.type != ASTNodeType.STATIC_ACCESS) throw new Error('only direct calls for now')
	let params = node.parameters.list.map(p=>{
		let maybe = new MaybeWrapper<{esr:ESR,ref:boolean}>()
		if (p.type == ASTNodeType.REFERENCE) {
			let declw = resolveStatic(p.ref,scope,ctx) // scope.symbols.getDeclaration(p.expr.identifier,ctx)
			if (!declw.value) return maybe.none()
			if (declw.value.decl.type != DeclarationType.VARIABLE) {
				ctx.addError(astError(p.ref,'can only reference variables'))
				return maybe.none()
			}
			return maybe.wrap({ref:true,esr:declw.value.decl.esr})
		}
		let esr = exprParser(p,scope,ctx,evalOnly)
		if (!esr.value) return maybe.none()
		return maybe.wrap({esr:esr.value,ref:false})
	})
	let declw = resolveStatic(node.function,scope,ctx) //symbols.getDeclaration(node.function.identifier.value)
	if (!declw.value) return maybe.none()
	let decl = declw.value.decl
	if (decl.type != DeclarationType.FUNCTION) {
		console.log(decl)
		ctx.addError(astError(node.function,'not a fn'))
		return maybe.none()
	}
	if (params.length != decl.parameters.length) {
		ctx.addError(astError(node.function,'param length unmatched'))
		return maybe.none()
	}
	let copyBackInstrs: Instruction[] = []
	for (let i = 0; i < params.length; i++) {
		let param = params[i]
		if (!param.value) continue
		let declParam = decl.parameters[i]
		if (!declParam.value) continue
		let esr = declParam.value.param
		let canNoDo = false
		if (!hasSharedType(getESRType(param.value.esr),getESRType(esr))) {
			ctx.addError(new CompileError(astErrorMsg(node.parameters.list[i],'param type mismatch'),false))
			canNoDo = true
		}
		if (param.value.ref != declParam.value.ref) {
			ctx.addError(new CompileError(astErrorMsg(node.parameters.list[i],'reference mismatch'),false))
			canNoDo = true
		}
		if (canNoDo) {
			maybe.noWrap()
			continue
		}
		copyBackInstrs.push(...assignESR(declParam.value.param,param.value.esr))
		switch (esr.type) {
			case ESRType.BOOL:
				throw new Error('no impl')
			case ESRType.INT:
				let instr: INT_OP = {
					type: InstrType.INT_OP,
					from: param.value.esr as IntESR,
					into: esr,
					op: '='
				}
				if (!evalOnly)
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
				if (!evalOnly)
					scope.push(invokeInstr,copyRet,...copyBackInstrs)
				return maybe.wrap(into)
			}
			case ElementaryValueType.VOID: {
				if (!evalOnly)
					scope.push(invokeInstr,...copyBackInstrs)
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

function operator(node:ASTOpNode,scope:Scope,ctx:CompileContext,evalOnly:boolean): Maybe<IntESR> {
	const maybe = new MaybeWrapper<IntESR>()
	switch (node.operator.value) {
		case '+':
		case '-':
		case '*':
		case '/':
		case '%': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,ctx,evalOnly))
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

			let copy = copyESR(o0.value,ctx,scope,'tmp',{tmp:true,const:false,mutable:false})
			let op: INT_OP = {type:InstrType.INT_OP,into:copy.esr,from:o1.value,op:node.operator.value+'='}
			if (!evalOnly)
				scope.push(copy.copyInstr,op)
			return maybe.wrap(copy.esr)
		}

		case '=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,ctx,evalOnly))
			if (!o0.value || !o1.value)
				return maybe.none()
			if (!o0.value.mutable) {
				ctx.addError(new CompileError(astErrorMsg(node.operands[0],'left hand side immutable'),false))
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
			
			let copy = copyESR(o0.value,ctx,scope,'tmp',{tmp:true,const:false,mutable:false})
			let op: INT_OP = {type:InstrType.INT_OP,into:o0.value,from:o1.value,op:'='}
			if (!evalOnly)
				scope.push(op,copy.copyInstr)
			return maybe.wrap(copy.esr)
		}
		
		case '+=':
		case '-=':
		case '*=':
		case '/=':
		case '%=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>exprParser(o,scope,ctx,evalOnly))
			if (!o0.value || !o1.value)
				return maybe.none()
			if (!o0.value.mutable) {
				ctx.addError(new CompileError(astErrorMsg(node.operands[0],'left hand side immutable'),false))
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
			let copy = copyESR(o0.value,ctx,scope,'tmp',{tmp:true,const:false,mutable:false})
			let op1: INT_OP = {type:InstrType.INT_OP,into:o0.value,from:o1.value,op:node.operator.value}
			if (!evalOnly)
				scope.push(op1,copy.copyInstr)
			return maybe.wrap(copy.esr)
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
