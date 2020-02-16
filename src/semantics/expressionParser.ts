import { ASTNode, ASTNodeType, ASTOpNode, ASTExpr, ASTCallNode } from "../syntax/AST"
import { exhaust, Errorable } from "../toolbox/other"
import { ParseTree, PTKind, PTExpr, PTOpNode, ptExprToType, ptCanMut, PTCallNode, PTVarNode } from "./ParseTree"
import { Logger } from "../toolbox/Logger"
import { resolveStatic, resolveAccess } from "./resolveAccess"
import { DeclarationType } from "./declarations/Declaration"
import { Type, isSubType, ValueType } from "./types/Types"
import { Scope } from "./Scope"
import { ResultWrapper, Result } from "../toolbox/Result"

export function parseExpression(
	node: ASTExpr,
	scope: Scope,
	log: Logger
): Result<PTExpr,ValueType> {

	const result = new ResultWrapper<PTExpr,ValueType>()

	switch (node.type) {

		case ASTNodeType.ACCESS:
		case ASTNodeType.IDENTIFIER: {
			let res = resolveAccess(node,scope,log)
			if (result.merge(res)) return result.none()
			let {decl} = res.getValue()
			switch (decl.type) {
				case DeclarationType.VARIABLE:
					return result.wrap({kind:PTKind.VARIABLE,decl})
				default: throw new Error('kiiill mmeeeee '+DeclarationType[decl.type])
			}
		}
		
		case ASTNodeType.SELECTOR:
			return result.wrap({kind:PTKind.PRIMITIVE,value:{type:Type.SELECTOR},scopeNames:scope.getScopeNames()})
		case ASTNodeType.PRIMITIVE: {
			if (node.value.value == 'true')
				return result.wrap({kind:PTKind.PRIMITIVE,value:{type:Type.BOOL,value:true},scopeNames:scope.getScopeNames()})
			if (node.value.value == 'false')
				return result.wrap({kind:PTKind.PRIMITIVE,value:{type:Type.BOOL,value:false},scopeNames:scope.getScopeNames()})
			if (node.value.value.startsWith('\'')) {
				log.addError(node.value.error('no strings in expressions for now I guess'))
				return result.none()
			}
			let n = Number(node.value.value)
			if (Number.isNaN(n)||!Number.isInteger(n)) {
				log.addError(node.value.error('kkk only int primitives'))
				return result.none()
			}
			return result.wrap({kind:PTKind.PRIMITIVE,value:{type:Type.INT,value:n},scopeNames:scope.getScopeNames()})
		}

		case ASTNodeType.OPERATION: {
			return result.pass(operator(node,scope,log))
		}

		case ASTNodeType.INVOKATION:
			return result.pass(invokation(node,scope,log))			

		case ASTNodeType.LIST:
			log.addError(node.error('no lists in expr yet'))
			return result.none()

		default:
			return exhaust(node)

	}

}

function invokation(node:ASTCallNode,scope:Scope,log:Logger): Result<PTCallNode,ValueType> {
	type Arg = ({ref:true,pt:PTVarNode}|{ref:false,pt:PTExpr})
	const result = new ResultWrapper<PTCallNode,ValueType>()
	if (node.func.type != ASTNodeType.IDENTIFIER && node.func.type != ASTNodeType.ACCESS) throw new Error('only direct calls for now')
	const params: Result<Arg,null>[] = node.parameters.map(p=>{
		const result = new ResultWrapper<Arg,null>()
		if (p.type == ASTNodeType.REFERENCE) {
			throw new Error('wait ref')
			/*let res = resolveAccess(p.ref,scope,log)
			if (!res.value) return maybe.none()
			if (res.value.isESR) {
				log.addError(node.func.error('cannot reference an expression'))
				return maybe.none()
			}
			let declw = res.value.wrapper
			if (declw.decl.type != DeclarationType.VARIABLE) {
				log.addError(p.ref.error('can only reference variables'))
				return maybe.none()
			}
			return maybe.wrap({ref:true,esr:declw.decl.esr})*/
		}
		let pt = parseExpression(p,scope,log)
		if (result.merge(pt)) return result.none()
		return result.wrap({pt:pt.getValue(),ref:false})
	})
	if (node.func.type == ASTNodeType.ACCESS && !node.func.isStatic)
		throw new Error('wait dyn access')
	let res = resolveStatic(node.func,scope.symbols,log)
	if (result.merge(res)) return result.none()
	let {decl,token} = res.getValue()
	if (decl.type == DeclarationType.STRUCT) {
		log.addError(node.func.error('con_struct_ion not available yet'))
		return result.none()
	}
	if (decl.type != DeclarationType.FUNCTION) {
		log.addError(node.func.error('not a fn'))
		return result.none()
	}
	if (decl.thisBinding.type != Type.VOID) return token.throwDebug('methods not implemented')
	if (params.length != decl.parameters.length) {
		log.addError(node.func.error('param length unmatched'))
		return result.none()
	}
	let args: Arg[] = []
	for (let i = 0; i < params.length; i++) {
		let paramRes = params[i]
		if (result.merge(paramRes)) continue
		let param = paramRes.getValue()
		let declParam = decl.parameters[i]
		let canNoDo = false
		if (!isSubType(declParam.type,ptExprToType(param.pt))) {
			log.addError(node.parameters[i].error('param type mismatch'))
			canNoDo = true
		}
		if (param.ref != declParam.isRef) {
			log.addError(node.parameters[i].error('reference mismatch'))
			canNoDo = true
		}
		if (canNoDo)
			continue
		args.push(param)
	}
	if (!decl.returns) return result.none()
	return result.wrap({
		kind: PTKind.INVOKATION,
		func: decl,
		args,
		scopeNames:scope.getScopeNames()
	})
}

function operator(node:ASTOpNode,scope:Scope,log:Logger): Result<PTOpNode,ValueType> {
	const result = new ResultWrapper<PTOpNode,ValueType>()
	switch (node.operator.value) {
		case '+':
		case '-':
		case '*':
		case '/':
		case '%': {
			console.assert(node.operands.length == 2, 'two operands') // skipping unary plus and minus for now
			let [o0,o1] = node.operands.map(o=>parseExpression(o,scope,log))
			if (result.merge(o0) || result.merge(o1))
				return result.none()
			let [t0,t1] = [ptExprToType(o0.getValue()),ptExprToType(o1.getValue())]
			if (t0.type != Type.INT) {
				log.addError(node.operator.error('only int op for now'))
				return result.none()
			}
			if (t0.type != t1.type) {
				log.addError(node.operator.error('no cast for now'))
				return result.none()
			}
			return result.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o0.getValue(),o1.getValue()],
				type: t0,
				scopeNames:scope.getScopeNames()
			})
		}

		case '=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>parseExpression(o,scope,log))
			if (result.merge(o0) || result.merge(o1))
				return result.none()
			if (!ptCanMut(o0.getValue())) {
				log.addError(node.operands[0].error('left hand side immutable'))
				return result.none()
			}
			let [t0,t1] = [ptExprToType(o0.getValue()),ptExprToType(o1.getValue())]
			if (!isSubType(t0,t1)) {
				log.addError(node.operator.error('types not assignable'))
				return result.none()
			}
			return result.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o0.getValue(),o1.getValue()],
				type: t0,
				scopeNames:scope.getScopeNames()
			})
		}

		case '+=':
		case '-=':
		case '*=':
		case '/=':
		case '%=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>parseExpression(o,scope,log))
			if (result.merge(o0) || result.merge(o1))
				return result.none()
			if (!ptCanMut(o0.getValue())) {
				log.addError(node.operands[0].error('left hand side immutable'))
				return result.none()
			}
			let [t0,t1] = [ptExprToType(o0.getValue()),ptExprToType(o1.getValue())]
			if (t0.type != Type.INT) {
				log.addError(node.operands[0].error('only int op for now'))
				return result.none()
			}
			if (t0.type != t1.type) {
				log.addError(node.operator.error('no cast for now'))
				return result.none()
			}
			return result.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o0.getValue(),o1.getValue()],
				type: t0,
				scopeNames:scope.getScopeNames()
			})
		}
		
		case '++':
		case '--': {
			console.assert(node.operands.length == 1, 'one operand')
			let o = parseExpression(node.operands[0],scope,log)
			if (result.merge(o))
				return result.none()
			if (!ptCanMut(o.getValue())) {
				log.addError(node.operands[0].error('left hand side immutable'))
				return result.none()
			}
			let type = ptExprToType(o.getValue())
			if (type.type != Type.INT) {
				log.addError(node.operator.error('only int op for now'))
				return result.none()
			}
			return result.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o.getValue()],
				type,
				scopeNames:scope.getScopeNames()
			})
		}
		
		case '>':
		case '<':
		case '>=':
		case '<=':
		case '==':
		case '!=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>parseExpression(o,scope,log))
			if (result.merge(o0) || result.merge(o1))
				return result.none()
			let [t0,t1] = [ptExprToType(o0.getValue()),ptExprToType(o1.getValue())]
			if (t0.type != Type.INT) {
				log.addError(node.operands[0].error('only int op for now'))
				return result.none()
			}
			if (t0.type != t1.type) {
				log.addError(node.operator.error('no cast for now'))
				return result.none()
			}
			return result.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o0.getValue(),o1.getValue()],
				type: {type:Type.BOOL},
				scopeNames:scope.getScopeNames()
			})
		}
		
		case '&&':
		case '||': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>parseExpression(o,scope,log))
			if (result.merge(o0) || result.merge(o1))
				return result.none()
			let [t0,t1] = [ptExprToType(o0.getValue()),ptExprToType(o1.getValue())]
			if (t0.type != Type.BOOL) {
				log.addError(node.operands[0].error('expected bool'))
			}
			if (t0.type != Type.BOOL) {
				log.addError(node.operands[1].error('expected bool'))
			}
			return result.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o0.getValue(),o1.getValue()],
				type: {type:Type.BOOL},
				scopeNames:scope.getScopeNames()
			})
		}	

		case '!': {
			console.assert(node.operands.length == 1, 'one operand')
			let o = parseExpression(node.operands[0],scope,log)
			if (result.merge(o))
				return result.none()
			let type = ptExprToType(o.getValue())
			if (type.type != Type.BOOL) {
				log.addError(node.operands[0].error('expected bool'))
			}
			return result.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o.getValue()],
				type: {type:Type.BOOL},
				scopeNames:scope.getScopeNames()
			})
		}	

		default:
			return exhaust(node.operator.value)
	}
}
