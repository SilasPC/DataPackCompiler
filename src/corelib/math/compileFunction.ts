import { CompileContext } from "../../toolbox/CompileContext";
import { FnDeclaration, DeclarationType } from "../../semantics/Declaration";
import { lexer } from "../../lexing/lexer";
import { fileSyntaxParser } from "../../syntax/fileSyntaxParser";
import { semanticsParser } from "../../semantics/semanticsParser";
import { MaybeWrapper } from "../../toolbox/Maybe";
import { SymbolTableLike } from "../../semantics/SymbolTable";

export function compileCoreFunction(
	fn:string,
	fnName:string,
	ctx:CompileContext
): FnDeclaration {

	let pf = ctx.loadFromSource(fn,'corelib')
	
	lexer(pf,ctx)
	fileSyntaxParser(pf,ctx)
	semanticsParser(pf,ctx,()=>new MaybeWrapper<SymbolTableLike>().none())

	let decl = pf.getSymbolTable().getDeclaration(fnName)

	if (!decl || decl.decl.type != DeclarationType.FUNCTION)
		throw new Error('failed to compile corelib function')

	return decl.decl

}
