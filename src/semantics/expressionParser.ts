import { ASTNode, ASTNodeType, ASTOpNode, ASTExpr, ASTCallNode, ASTRefNode } from "../syntax/AST"
import { Instruction, INT_OP, InstrType, INVOKE } from "../codegen/Instructions"
import { ESR, ESRType, IntESR, getESRType, assignESR, copyESR } from "./ESR"
import { DeclarationType, Declaration, DeclarationWrapper } from "./Declaration"
import { Type, isSubType } from "./types/Types"
import { exhaust } from "../toolbox/other"
import { CompileContext } from "../toolbox/CompileContext"
import { Scope } from "./Scope"
import { Maybe } from "../toolbox/Maybe"
import { MaybeWrapper } from "../toolbox/Maybe"
import { CompileError } from "../toolbox/CompileErrors"
import { resolveAccess } from "./resolveAccess"

export function exprParser(node: ASTExpr, scope: Scope, ctx: CompileContext, evalOnly:boolean): Maybe<ESR> {

	let maybe = new MaybeWrapper<ESR>()

	switch (node.type) {

		case ASTNodeType.SELECTOR:
			throw new Error('not implemented')

		case ASTNodeType.ACCESS:
		case ASTNodeType.IDENTIFIER: {
			let res = resolveAccess(node,scope,ctx)
			if (!res.value) return maybe.none()
			if (res.value.isESR) return maybe.wrap(res.value.esr)
			return coerseDeclWrapperToESR(res.value.wrapper,ctx)
		}
		
		case ASTNodeType.PRIMITIVE: {
			if (node.value.value == 'true')
				return maybe.wrap({type:ESRType.BOOL,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(1)})
			if (node.value.value == 'false')
				return maybe.wrap({type:ESRType.BOOL,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(0)})
			if (node.value.value.startsWith('\'')) {
				ctx.addError(node.value.error('no strings in expressions for now I guess'))
				return maybe.none()
			}
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

		case ASTNodeType.LIST:
			ctx.addError(node.error('no lists in expr yet'))
			return maybe.none()

		default:
			return exhaust(node)

	}

}

function invokation(node:ASTCallNode,scope:Scope,ctx:CompileContext,evalOnly:boolean,maybe:MaybeWrapper<ESR>) {
	if (node.func.type != ASTNodeType.IDENTIFIER && node.func.type != ASTNodeType.ACCESS) throw new Error('only direct calls for now')
	let params = node.parameters.map(p=>{
		let maybe = new MaybeWrapper<{esr:ESR,ref:boolean}>()
		if (p.type == ASTNodeType.REFERENCE) {
			let res = resolveAccess(p.ref,scope,ctx) // scope.symbols.getDeclaration(p.expr.identifier,ctx)
			if (!res.value) return maybe.none()
			if (res.value.isESR) {
				ctx.addError(node.func.error('cannot reference an expression'))
				return maybe.none()
			}
			let declw = res.value.wrapper
			if (declw.decl.type != DeclarationType.VARIABLE) {
				ctx.addError(p.ref.error('can only reference variables'))
				return maybe.none()
			}
			return maybe.wrap({ref:true,esr:declw.decl.esr})
		}
		let esr = exprParser(p,scope,ctx,evalOnly)
		if (!esr.value) return maybe.none()
		return maybe.wrap({esr:esr.value,ref:false})
	})
	let res = resolveAccess(node.func,scope,ctx) //symbols.getDeclaration(node.func.identifier.value)
	if (!res.value) return maybe.none()
	if (res.value.isESR) {
		ctx.addError(node.func.error('expected a callable expression'))
		return maybe.none()
	}
	let declw = res.value.wrapper
	let decl = declw.decl
	if (decl.type != DeclarationType.FUNCTION) {
		console.log(decl)
		ctx.addError(node.func.error('not a fn'))
		return maybe.none()
	}
	if (decl.thisBinding != null) return declw.token.throwDebug('methods not implemented')
	if (params.length != decl.parameters.length) {
		ctx.addError(node.func.error('param length unmatched'))
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
		if (!isSubType(getESRType(param.value.esr),getESRType(esr))) {
			ctx.addError(node.parameters[i].error('param type mismatch'))
			canNoDo = true
		}
		if (param.value.ref != declParam.value.ref) {
			ctx.addError(node.parameters[i].error('reference mismatch'))
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
	switch (returnType.type) {
		case Type.INT: {
			let into: IntESR = {type:ESRType.INT,mutable:false,const:false,tmp:true,scoreboard:ctx.scoreboards.getStatic('tmp',scope)}
			if (decl.returns.type != ESRType.INT) throw new Error('ESR error')
			let copyRet: INT_OP = {type:InstrType.INT_OP,into,from:decl.returns,op:'='}
			if (!evalOnly)
				scope.push(invokeInstr,copyRet,...copyBackInstrs)
			return maybe.wrap(into)
		}
		case Type.VOID: {
			if (!evalOnly)
				scope.push(invokeInstr,...copyBackInstrs)
			return maybe.wrap({type:ESRType.VOID,mutable:false,const:false,tmp:false})
		}
		case Type.BOOL:
			throw new Error('no bool ret rn')
		case Type.SELECTOR:
			throw new Error('selector return not implemented')
		case Type.STRUCT:
			throw new Error('struct return not yet')
		default:
			return exhaust(returnType)
	}
}

function operator(node:ASTOpNode,scope:Scope,ctx:CompileContext,evalOnly:boolean): Maybe<ESR> {
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
				ctx.addError(node.operands[0].error('left hand side immutable'))
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
				ctx.addError(node.operands[0].error('left hand side immutable'))
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
		
		case '++':
		case '--': {
			console.assert(node.operands.length == 1, 'one operand')
			let o = exprParser(node.operands[0],scope,ctx,evalOnly)
			if (!o.value)
				return maybe.none()
			if (!o.value.mutable) {
				ctx.addError(node.operands[0].error('left hand side immutable'))
				return maybe.none()
			}
			if (o.value.type != ESRType.INT) {
				ctx.addError(node.operator.error('only int op for now'))
				return maybe.none()
			}
			let copy = copyESR(o.value,ctx,scope,'tmp',{tmp:true,const:false,mutable:false})
			let esr: IntESR = {type:ESRType.INT,mutable:false,const:true,tmp:false,scoreboard:ctx.scoreboards.getConstant(1)}
			let op: INT_OP = {type:InstrType.INT_OP,into:o.value,from:esr,op:node.operator.value[0]+'='}
			if (!evalOnly)
				scope.push(op,copy.copyInstr)
			return maybe.wrap(copy.esr)
		}
		
		case '&&':
		case '||':

		case '!':
		
		case '>':
		case '<':
		case '>=':
		case '<=':
		case '==':
		case '!=':
			ctx.addError(new CompileError('i rly h8 boilerplate',false))
			return maybe.none()

		default:
			return exhaust(node.operator.value)
	}
}

function coerseDeclWrapperToESR(decl:DeclarationWrapper,ctx:CompileContext): Maybe<ESR> {
	const maybe = new MaybeWrapper<ESR>()
	switch (decl.decl.type) {
		case DeclarationType.VARIABLE: return maybe.wrap(decl.decl.esr)
		case DeclarationType.FUNCTION:
				ctx.addError(decl.token.error('cannot use function as value'))
				return maybe.none()
		case DeclarationType.MODULE:
			ctx.addError(decl.token.error('cannot use module as value'))
			return maybe.none()
		case DeclarationType.RECIPE:
			ctx.addError(decl.token.error('cannot use recipe as value'))
			return maybe.none()
		default:
			return exhaust(decl.decl)
	}
}
