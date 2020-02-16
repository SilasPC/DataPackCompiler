
import { ASTNodeType, ASTIdentifierNode, ASTAccess, ASTDynamicAccessNode, ASTStaticAccessNode } from "../syntax/AST";
import { DeclarationType, DeclarationWrapper } from "./declarations/Declaration";
import { GenericToken } from "../lexing/Token";
import { SymbolTable, ReadOnlySymbolTable } from "./declarations/SymbolTable";
import { parseExpression } from "./expressionParser";
import { Scope } from "./Scope";
import { ResultWrapper, Result } from "../toolbox/Result";

export function resolveStatic(node:ASTStaticAccessNode|ASTIdentifierNode,symbols:SymbolTable): Result<DeclarationWrapper,null> {
	const result = new ResultWrapper<DeclarationWrapper,null>()
	if (node.type == ASTNodeType.IDENTIFIER)
		return symbols.getDeclaration(node.identifier)

	let staticAccesses: GenericToken[] = []
	let op = node
	while (true) {
		if (!op.isStatic) {
			result.addError(op.error('cannot access statically on non static'))
			return result.none()
		}
		if (op.accessee.type == ASTNodeType.IDENTIFIER) {
			staticAccesses.push(op.accessee.identifier)
			staticAccesses.push(op.access)
			break
		}
		staticAccesses.push(op.access)
		op = op.accessee
	}

	let sym: ReadOnlySymbolTable = symbols
	for (let i = 0; i < staticAccesses.length; i++) {
		let acc = staticAccesses[i]
		let declw = sym.getDeclaration(acc)
		if (result.merge(declw)) return result.none()
		let w = declw.getValue()
		if (w.decl.type == DeclarationType.MODULE) {
			if (i == staticAccesses.length - 1) {
				return result.wrap(declw.getValue())
			}
			sym = w.decl.symbols
			if (i == staticAccesses.length - 1) {
				result.addError(w.token.error('module cannot be used directly'))
				return result.none()
			}
			continue
		}
		if (i != staticAccesses.length - 1) {
			result.addError(staticAccesses[i+1].error('static access on non-module'))
			return result.none()
		}
		return result.wrap(declw.getValue())
	}
	throw new Error('cannot happen')
}

export function resolveAccess(node:ASTAccess,scope:Scope): Result<DeclarationWrapper,null> {
	const result = new ResultWrapper<DeclarationWrapper,null>()

	if (node.type == ASTNodeType.IDENTIFIER)
		return scope.symbols.getDeclaration(node.identifier)

	let dynAccesses: GenericToken[] = []
	let accessOn: DeclarationWrapper

	doStatic: {

		let staticOp: ASTStaticAccessNode | null = null

		if (!node.isStatic) {

			let dynOp: ASTDynamicAccessNode = node

			while (true) {
				dynAccesses.push(dynOp.access)
				if (dynOp.accessee.type == ASTNodeType.IDENTIFIER) {
					let declw = scope.symbols.getDeclaration(dynOp.accessee.identifier)
					if (result.merge(declw)) return result.none()
					accessOn = declw.getValue()
					break doStatic
				} else if (dynOp.accessee.type == ASTNodeType.ACCESS) {
					if (dynOp.accessee.isStatic) {
						staticOp = dynOp.accessee
						break
					}
					dynOp = dynOp.accessee
				} else {
					let expr = parseExpression(dynOp.accessee,scope)
					if (result.merge(expr)) return result.none()
					throw new Error('wait dyn process')
					//return processDynamic(expr.value)
				}
			}

		} else staticOp = node

		let staticAccesses: GenericToken[] = []
		while (true) {
			if (staticOp.accessee.type == ASTNodeType.IDENTIFIER) {
				staticAccesses.push(staticOp.accessee.identifier)
				staticAccesses.push(staticOp.access)
				break
			}
			staticAccesses.push(staticOp.access)
			staticOp = staticOp.accessee
		}

		// console.log(staticAccesses.map(t=>t.value),dynAccesses.map(t=>t.value))

		let sym: ReadOnlySymbolTable = scope.symbols
		for (let i = 0; i < staticAccesses.length; i++) {
			let acc = staticAccesses[i]
			let declw = sym.getDeclaration(acc)
			if (result.merge(declw)) return result.none()
			let w = declw.getValue()
			if (w.decl.type == DeclarationType.MODULE) {
				if (i == staticAccesses.length - 1) {
					accessOn = w
					break doStatic
				}
				sym = w.decl.symbols
				if (i == staticAccesses.length - 1) {
					result.addError(w.token.error('module cannot be used directly'))
					return result.none()
				}
				continue
			}
			if (i != staticAccesses.length - 1) {
				result.addError(staticAccesses[i+1].error('static access on non-module'))
				return result.none()
			}
			accessOn = w
			break doStatic
		}

		throw new Error('cannot happen')

	}

	if (dynAccesses.length == 0)
		return result.wrap(accessOn)
	// this is fields/methods on static variables

	if (accessOn.decl.type == DeclarationType.VARIABLE)
		//return processDynamic(accessOn.decl.esr)
	
	result.addError(dynAccesses[0].error('dynamic access not quite ready'))
	return result.none()
	
	/*function processDynamic(esr:ESR): Maybe<ReturnType> {
		const maybe = new MaybeWrapper<ReturnType>()

		if (dynAccesses.length == 0) return maybe.wrap({isESR:true,esr})

		// console.log(dynAccesses.map(t=>t.value))
		result.addError(dynAccesses[0].error('not ready to dyn resolve'))

		return maybe.none()

	}*/

}
