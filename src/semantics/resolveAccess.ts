import { ASTOpNode, ASTNodeType, ASTIdentifierNode, ASTAccess, ASTDynamicAccessNode, ASTStaticAccessNode } from "../syntax/AST";
import { Scope } from "./Scope";
import { CompileContext } from "../toolbox/CompileContext";
import { Declaration, DeclarationType, ModDeclaration, DeclarationWrapper } from "./Declaration";
import { MaybeWrapper, Maybe } from "../toolbox/Maybe";
import { TokenType, GenericToken, TokenI } from "../lexing/Token";
import { CompileError } from "../toolbox/CompileErrors";
import { SymbolTable, ReadOnlySymbolTable } from "./SymbolTable";
import { exprParser } from "./expressionParser";
import { ESR } from "./ESR";
import { exhaust } from "../toolbox/other";

export function resolveStatic(node:ASTStaticAccessNode|ASTIdentifierNode,scope:Scope,ctx:CompileContext): Maybe<DeclarationWrapper> {
	const maybe = new MaybeWrapper<DeclarationWrapper>()
	if (node.type == ASTNodeType.IDENTIFIER)
		return scope.symbols.getDeclaration(node.identifier,ctx)

	let staticAccesses: GenericToken[] = []
	let op = node
	while (true) {
		if (!op.isStatic) {
			ctx.addError(op.error('cannot access statically on non static'))
			return maybe.none()
		}
		if (op.accessee.type == ASTNodeType.IDENTIFIER) {
			staticAccesses.push(op.accessee.identifier)
			staticAccesses.push(op.access)
			break
		}
		staticAccesses.push(op.access)
		op = op.accessee
	}

	let sym: ReadOnlySymbolTable = scope.symbols
	for (let i = 0; i < staticAccesses.length; i++) {
		let acc = staticAccesses[i]
		let declw = sym.getDeclaration(acc,ctx)
		if (maybe.merge(declw)) return maybe.none()
		if (declw.value.decl.type == DeclarationType.MODULE) {
			if (i == staticAccesses.length - 1) {
				return maybe.wrap(declw.value)
			}
			sym = declw.value.decl.symbols
			if (i == staticAccesses.length - 1) {
				ctx.addError(declw.value.token.error('module cannot be used directly'))
				return maybe.none()
			}
			continue
		}
		if (i != staticAccesses.length - 1) {
			ctx.addError(staticAccesses[i+1].error('static access on non-module'))
			return maybe.none()
		}
		return maybe.wrap(declw.value)
	}
	throw new Error('cannot happen')
}

type ReturnType = {isESR:true,esr:ESR}|{isESR:false,wrapper:DeclarationWrapper}
export function resolveAccess(node:ASTAccess,scope:Scope,ctx:CompileContext): Maybe<ReturnType> {
	const maybe = new MaybeWrapper<ReturnType>()

	if (node.type == ASTNodeType.IDENTIFIER)
		return maybe.map(scope.symbols.getDeclaration(node.identifier,ctx),
			wrapper=>({isESR:false,wrapper}))

	let dynAccesses: GenericToken[] = []
	let accessOn: DeclarationWrapper

	doStatic: {

		let staticOp: ASTStaticAccessNode | null = null

		if (!node.isStatic) {

			let dynOp: ASTDynamicAccessNode = node

			while (true) {
				dynAccesses.push(dynOp.access)
				if (dynOp.accessee.type == ASTNodeType.IDENTIFIER) {
					let declw = scope.symbols.getDeclaration(dynOp.accessee.identifier,ctx)
					if (!declw.value) return maybe.none()
					accessOn = declw.value
					break doStatic
				} else if (dynOp.accessee.type == ASTNodeType.ACCESS) {
					if (dynOp.accessee.isStatic) {
						staticOp = dynOp.accessee
						break
					}
					dynOp = dynOp.accessee
				} else {
					let expr = exprParser(dynOp.accessee,scope,ctx,false)
					if (!expr.value) return maybe.none()
					return processDynamic(expr.value)
				}
			}

		} else staticOp = node

		if (!staticOp) throw new Error('should not happen')

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
			let declw = sym.getDeclaration(acc,ctx)
			if (maybe.merge(declw)) return maybe.none()
			if (declw.value.decl.type == DeclarationType.MODULE) {
				if (i == staticAccesses.length - 1) {
					accessOn = declw.value
					break doStatic
				}
				sym = declw.value.decl.symbols
				if (i == staticAccesses.length - 1) {
					ctx.addError(declw.value.token.error('module cannot be used directly'))
					return maybe.none()
				}
				continue
			}
			if (i != staticAccesses.length - 1) {
				ctx.addError(staticAccesses[i+1].error('static access on non-module'))
				return maybe.none()
			}
			accessOn = declw.value
			break doStatic
		}

		throw new Error('cannot happen')

	}

	if (dynAccesses.length == 0)
		return maybe.wrap({isESR:false,wrapper:accessOn})
	// this is fields/methods on static variables

	if (accessOn.decl.type == DeclarationType.VARIABLE)
		return processDynamic(accessOn.decl.esr)
	
	ctx.addError(dynAccesses[0].error('dynamic access not quite ready'))
	return maybe.none()
	
	function processDynamic(esr:ESR): Maybe<ReturnType> {
		const maybe = new MaybeWrapper<ReturnType>()

		if (dynAccesses.length == 0) return maybe.wrap({isESR:true,esr})

		// console.log(dynAccesses.map(t=>t.value))
		ctx.addError(dynAccesses[0].error('not ready to dyn resolve'))

		return maybe.none()

	}

}
