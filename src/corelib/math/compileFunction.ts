import { CompileContext } from "../../toolbox/CompileContext";
import { FnDeclaration, DeclarationType } from "../../semantics/Declaration";
import { lexer } from "../../lexing/lexer";
import { fileSyntaxParser } from "../../syntax/fileSyntaxParser";
import { semanticsParser } from "../../semantics/semanticsParser";
import { ParsingFile } from "../../toolbox/ParsingFile";
import { ESR, ESRType, IntESR } from "../../semantics/ESR";
import { tokenToType, ElementaryValueType } from "../../semantics/Types";
import { exhaust } from "../../toolbox/other";
import { ASTNodeType } from "../../syntax/AST";
import { Scope } from "../../semantics/Scope";
import { SymbolTable } from "../../semantics/SymbolTable";

export function compileCoreFunction(
	fn:string,
	fnName:string,
	ctx:CompileContext
): FnDeclaration {

	let pf = ctx.loadFromSource(fn)
	
	lexer(pf,ctx)
	fileSyntaxParser(pf,ctx)
	semanticsParser(pf,ctx,()=>null)

	let decl = pf.getSymbolTable().getDeclaration(fnName)

	if (!decl || decl.decl.type != DeclarationType.FUNCTION)
		throw new Error('failed to compile corelib function')

	return decl.decl

}
