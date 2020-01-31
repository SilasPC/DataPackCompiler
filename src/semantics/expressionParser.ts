import { ASTNode, ASTNodeType, ASTOpNode, ASTExpr, ASTCallNode, ASTRefNode } from "../syntax/AST"
import { exhaust, Errorable } from "../toolbox/other"
import { Maybe } from "../toolbox/Maybe"
import { MaybeWrapper } from "../toolbox/Maybe"
import { CompileError } from "../toolbox/CompileErrors"
import { ParseTree, PTKind, PTExpr, PTOpNode, ptExprToType, ptCanMut, PTCallNode, PTVarNode } from "./ParseTree"
import { Logger } from "../toolbox/Logger"
import { resolveStatic, resolveAccess } from "./resolveAccess"
import { DeclarationType } from "./Declaration"
import { Type, isSubType } from "./types/Types"
import { Scope } from "./Scope"

export function parseExpression(
	node: ASTExpr,
	scope: Scope,
	log: Logger
): Maybe<PTExpr> {

	const maybe = new MaybeWrapper<PTExpr>()

	switch (node.type) {

		case ASTNodeType.ACCESS:
		case ASTNodeType.IDENTIFIER: {
			let res = resolveAccess(node,scope,log)
			if (!res.value) return maybe.none()
			switch (res.value.decl.type) {
				case DeclarationType.VARIABLE:
					return maybe.wrap({kind:PTKind.VARIABLE,decl:res.value.decl})
				default: throw new Error('kiiill mmeeeee')
			}
		}
		
		case ASTNodeType.SELECTOR:
			return maybe.wrap({kind:PTKind.PRIMITIVE,value:{type:Type.SELECTOR},scopeNames:scope.getScopeNames()})
		case ASTNodeType.PRIMITIVE: {
			if (node.value.value == 'true')
				return maybe.wrap({kind:PTKind.PRIMITIVE,value:{type:Type.BOOL,value:true},scopeNames:scope.getScopeNames()})
			if (node.value.value == 'false')
				return maybe.wrap({kind:PTKind.PRIMITIVE,value:{type:Type.BOOL,value:false},scopeNames:scope.getScopeNames()})
			if (node.value.value.startsWith('\'')) {
				log.addError(node.value.error('no strings in expressions for now I guess'))
				return maybe.none()
			}
			let n = Number(node.value.value)
			if (Number.isNaN(n)||!Number.isInteger(n)) {
				log.addError(node.value.error('kkk only int primitives'))
				return maybe.none()
			}
			return maybe.wrap({kind:PTKind.PRIMITIVE,value:{type:Type.INT,value:n},scopeNames:scope.getScopeNames()})
		}

		case ASTNodeType.OPERATION: {
			return maybe.pass(operator(node,scope,log))
		}

		case ASTNodeType.INVOKATION:
			return maybe.pass(invokation(node,scope,log))			

		case ASTNodeType.LIST:
			log.addError(node.error('no lists in expr yet'))
			return maybe.none()

		default:
			return exhaust(node)

	}

}

function invokation(node:ASTCallNode,scope:Scope,log:Logger): Maybe<PTCallNode> {
	type Arg = ({ref:true,pt:PTVarNode}|{ref:false,pt:PTExpr})
	const maybe = new MaybeWrapper<PTCallNode>()
	if (node.func.type != ASTNodeType.IDENTIFIER && node.func.type != ASTNodeType.ACCESS) throw new Error('only direct calls for now')
	const params: Maybe<Arg>[] = node.parameters.map(p=>{
		const maybe = new MaybeWrapper<Arg>()
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
		if (!pt.value) return maybe.none()
		return maybe.wrap({pt:pt.value,ref:false})
	})
	if (node.func.type == ASTNodeType.ACCESS && !node.func.isStatic)
		throw new Error('wait dyn access')
	let res = resolveStatic(node.func,scope.symbols,log)
	if (!res.value) return maybe.none()
	let decl = res.value.decl
	if (decl.type == DeclarationType.STRUCT) {
		log.addError(node.func.error('con_struct_ion not available yet'))
		return maybe.none()
	}
	if (decl.type != DeclarationType.FUNCTION) {
		log.addError(node.func.error('not a fn'))
		return maybe.none()
	}
	if (decl.thisBinding.type != Type.VOID) return res.value.token.throwDebug('methods not implemented')
	if (params.length != decl.parameters.length) {
		log.addError(node.func.error('param length unmatched'))
		return maybe.none()
	}
	for (let i = 0; i < params.length; i++) {
		let param = params[i]
		if (!param.value) continue
		let declParam = decl.parameters[i]
		let canNoDo = false
		if (!isSubType(declParam.type,ptExprToType(param.value.pt))) {
			log.addError(node.parameters[i].error('param type mismatch'))
			canNoDo = true
		}
		if (param.value.ref != declParam.isRef) {
			log.addError(node.parameters[i].error('reference mismatch'))
			canNoDo = true
		}
		if (canNoDo) {
			maybe.noWrap()
			continue
		}
	}
	if (!decl.returns) return maybe.none()
	return maybe.wrap({
		kind: PTKind.INVOKATION,
		func: decl,
		args: params.map(p=>p.value as Arg),
		scopeNames:scope.getScopeNames()
	})
}

function operator(node:ASTOpNode,scope:Scope,log:Logger): Maybe<PTOpNode> {
	const maybe = new MaybeWrapper<PTOpNode>()
	switch (node.operator.value) {
		case '+':
		case '-':
		case '*':
		case '/':
		case '%': {
			console.assert(node.operands.length == 2, 'two operands') // skipping unary plus and minus for now
			let [o0,o1] = node.operands.map(o=>parseExpression(o,scope,log))
			if (!o0.value || !o1.value)
				return maybe.none()
			let [t0,t1] = [ptExprToType(o0.value),ptExprToType(o1.value)]
			if (t0.type != Type.INT) {
				log.addError(node.operator.error('only int op for now'))
				return maybe.none()
			}
			if (t0.type != t1.type) {
				log.addError(node.operator.error('no cast for now'))
				return maybe.none()
			}
			return maybe.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o0.value,o1.value],
				type: t0,
				scopeNames:scope.getScopeNames()
			})
		}

		case '=': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>parseExpression(o,scope,log))
			if (!o0.value || !o1.value)
				return maybe.none()
			if (!ptCanMut(o0.value)) {
				log.addError(node.operands[0].error('left hand side immutable'))
				return maybe.none()
			}
			let [t0,t1] = [ptExprToType(o0.value),ptExprToType(o1.value)]
			if (!isSubType(t0,t1)) {
				log.addError(node.operator.error('types not assignable'))
				return maybe.none()
			}
			return maybe.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o0.value,o1.value],
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
			if (!o0.value || !o1.value)
				return maybe.none()
			if (!ptCanMut(o0.value)) {
				log.addError(node.operands[0].error('left hand side immutable'))
				return maybe.none()
			}
			let [t0,t1] = [ptExprToType(o0.value),ptExprToType(o1.value)]
			if (t0.type != Type.INT) {
				log.addError(node.operands[0].error('only int op for now'))
				return maybe.none()
			}
			if (t0.type != t1.type) {
				log.addError(node.operator.error('no cast for now'))
				return maybe.none()
			}
			return maybe.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o0.value,o1.value],
				type: t0,
				scopeNames:scope.getScopeNames()
			})
		}
		
		case '++':
		case '--': {
			console.assert(node.operands.length == 1, 'one operand')
			let o = parseExpression(node.operands[0],scope,log)
			if (!o.value)
				return maybe.none()
			if (!ptCanMut(o.value)) {
				log.addError(node.operands[0].error('left hand side immutable'))
				return maybe.none()
			}
			let type = ptExprToType(o.value)
			if (type.type != Type.INT) {
				log.addError(node.operator.error('only int op for now'))
				return maybe.none()
			}
			return maybe.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o.value],
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
			if (!o0.value || !o1.value)
				return maybe.none()
			let [t0,t1] = [ptExprToType(o0.value),ptExprToType(o1.value)]
			if (t0.type != Type.INT) {
				log.addError(node.operands[0].error('only int op for now'))
				return maybe.none()
			}
			if (t0.type != t1.type) {
				log.addError(node.operator.error('no cast for now'))
				return maybe.none()
			}
			return maybe.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o0.value,o1.value],
				type: {type:Type.BOOL},
				scopeNames:scope.getScopeNames()
			})
		}
		
		case '&&':
		case '||': {
			console.assert(node.operands.length == 2, 'two operands')
			let [o0,o1] = node.operands.map(o=>parseExpression(o,scope,log))
			if (!o0.value || !o1.value)
				return maybe.none()
			let [t0,t1] = [ptExprToType(o0.value),ptExprToType(o1.value)]
			if (t0.type != Type.BOOL) {
				log.addError(node.operands[0].error('expected bool'))
				maybe.noWrap()
			}
			if (t0.type != Type.BOOL) {
				log.addError(node.operands[1].error('expected bool'))
				maybe.noWrap()
			}
			return maybe.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o0.value,o1.value],
				type: {type:Type.BOOL},
				scopeNames:scope.getScopeNames()
			})
		}	

		case '!': {
			console.assert(node.operands.length == 1, 'one operand')
			let o = parseExpression(node.operands[0],scope,log)
			if (!o.value)
				return maybe.none()
			let type = ptExprToType(o.value)
			if (type.type != Type.BOOL) {
				log.addError(node.operands[0].error('expected bool'))
				maybe.noWrap()
			}
			return maybe.wrap({
				kind: PTKind.OPERATOR,
				op: node.operator.value,
				vals: [o.value],
				type: {type:Type.BOOL},
				scopeNames:scope.getScopeNames()
			})
		}	

		default:
			return exhaust(node.operator.value)
	}
}
