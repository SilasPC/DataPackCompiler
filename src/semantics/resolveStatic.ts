import { ASTOpNode, ASTNodeType, astErrorMsg, ASTIdentifierNode, ASTStaticAccessNode, ASTExpr, astError } from "../syntax/AST";
import { Scope } from "./Scope";
import { CompileContext } from "../toolbox/CompileContext";
import { Declaration, DeclarationType, ModDeclaration, DeclarationWrapper } from "./Declaration";
import { MaybeWrapper, Maybe } from "../toolbox/Maybe";
import { TokenType, GenericToken, TokenI } from "../lexing/Token";
import { CompileError } from "../toolbox/CompileErrors";
import { SymbolTable, ReadOnlySymbolTable } from "./SymbolTable";

/*export function assertResolveStatic(node:ASTExpr,scope:Scope,ctx:CompileContext): Maybe<DeclarationWrapper> {
	const maybe = new MaybeWrapper<DeclarationWrapper>()

	if (node.type != ASTNodeType.IDENTIFIER && node.type != ASTNodeType.STATIC_ACCESS) {
		ctx.addError(astError(node,'expected static identifier'))
		return maybe.none()
	}

	return resolveStatic(node,scope,ctx)

}*/

export function resolveStatic(node:ASTStaticAccessNode|ASTIdentifierNode,scope:Scope,ctx:CompileContext): Maybe<DeclarationWrapper> {
	const maybe = new MaybeWrapper<DeclarationWrapper>()

	if (node.type == ASTNodeType.IDENTIFIER) {
		let xxx = scope.symbols.getDeclaration(node.identifier,ctx)
		return xxx
	}

	let op = node

	let accesses: GenericToken[] = []
	while (true) {
		if (op.accessee.type == ASTNodeType.IDENTIFIER) {
			accesses.push(op.accessee.identifier)
			accesses.push(op.access)
			break
		}
		accesses.push(op.access)
		op = op.accessee
	}

	let sym: ReadOnlySymbolTable = scope.symbols
	for (let i = 0; i < accesses.length; i++) {
		let acc = accesses[i]
		let declw = sym.getDeclaration(acc,ctx)
		if (maybe.merge(declw)) return maybe.none()
		if (declw.value.decl.type == DeclarationType.MODULE) {
			if (i == accesses.length - 1) return maybe.wrap(declw.value)
			sym = declw.value.decl.symbols
			continue
		}
		if (i != accesses.length - 1) {
			ctx.addError(accesses[i+1].error('static access on non-module'))
			return maybe.none()
		}
		return maybe.wrap(declw.value)
	}

	throw new Error('cannot happen')

}