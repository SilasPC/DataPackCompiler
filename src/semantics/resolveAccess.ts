
import { ASTNodeType, ASTIdentifierNode, ASTAccess, ASTDynamicAccessNode, ASTStaticAccessNode } from "../syntax/AST";
import { DeclarationType, Declaration } from "./declarations/Declaration";
import { GenericToken, TokenI } from "../lexing/Token";
import { SymbolTable, ReadOnlySymbolTable } from "./declarations/SymbolTable";
import { parseExpression } from "./expressionParser";
import { Scope } from "./Scope";
import { ResultWrapper, Result } from "../toolbox/Result";

export function resolveStaticNode(node:ASTIdentifierNode|ASTStaticAccessNode, symbols: SymbolTable): Result<Declaration,null> {
	if (node.type == ASTNodeType.IDENTIFIER) return resolveStatic([node.identifier],symbols)
	return resolveStatic(node.accessors,symbols)
}

export function resolveStatic(accessors:readonly TokenI[],symbols:SymbolTable): Result<Declaration,null> {
	const result = new ResultWrapper<Declaration,null>()

	let sym: ReadOnlySymbolTable = symbols
	for (let i = 0; i < accessors.length; i++) {
		let acc = accessors[i]
		let decl = sym.getDeclaration(acc)
		if (result.merge(decl)) return result.none()
		let w = decl.getValue()
		if (w.type == DeclarationType.MODULE) {
			if (i == accessors.length - 1) {
				return result.wrap(decl.getValue())
			}
			sym = w.getSymbols()
			if (i == accessors.length - 1) {
				result.addError(acc.error('module cannot be used directly'))
				return result.none()
			}
			continue
		}
		if (i != accessors.length - 1) {
			result.addError(accessors[i+1].error('static access on non-module'))
			return result.none()
		}
		return result.wrap(decl.getValue())
	}
	throw new Error('cannot happen')
}

export function resolveAccess(node:ASTAccess,scope:Scope): Result<Declaration,null> {
	const result = new ResultWrapper<Declaration,null>()

	if (node.type == ASTNodeType.IDENTIFIER)
		return scope.symbols.getDeclaration(node.identifier)

	let dynAccesses: GenericToken[] = []
	let accessOn: Declaration

	doStatic: {

		let staticOp: ASTStaticAccessNode | null = null

		if (!node.isStatic) {

			let dynOp: ASTDynamicAccessNode = node

			while (true) {
				dynAccesses.push(dynOp.access)
				if (dynOp.accessee.type == ASTNodeType.IDENTIFIER) {
					let decl = scope.symbols.getDeclaration(dynOp.accessee.identifier)
					if (result.merge(decl)) return result.none()
					accessOn = decl.getValue()
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

		let accessors = staticOp.accessors

		let sym: ReadOnlySymbolTable = scope.symbols
		for (let i = 0; i < accessors.length; i++) {
			let acc = accessors[i]
			let decl = sym.getDeclaration(acc)
			if (result.merge(decl)) return result.none()
			let w = decl.getValue()
			if (w.type == DeclarationType.MODULE) {
				if (i == accessors.length - 1) {
					accessOn = w
					break doStatic
				}
				sym = w.getSymbols()
				if (i == accessors.length - 1) {
					result.addError(acc.error('module cannot be used directly'))
					return result.none()
				}
				continue
			}
			if (i != accessors.length - 1) {
				result.addError(accessors[i+1].error('static access on non-module'))
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

	if (accessOn.type == DeclarationType.VARIABLE) null
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
