import { CompileContext } from "../toolbox/CompileContext";
import { FnDeclaration, DeclarationType, ModDeclaration } from "../semantics/Declaration";
import { lexer } from "../lexing/lexer";
import { fileSyntaxParser } from "../syntax/fileSyntaxParser";
import { semanticsParser } from "../semantics/semanticsParser";
import { MaybeWrapper } from "../toolbox/Maybe";
import { ParsingFile } from "../toolbox/ParsingFile";

export function compileCoreFunction(
	fn:string,
	fnName:string,
	ctx:CompileContext
): FnDeclaration {

	let pf = ctx.loadFromSource(fn,'corelib')
	
	lexer(pf,ctx)
	fileSyntaxParser(pf,ctx)
	semanticsParser(pf,ctx,()=>new MaybeWrapper<ModDeclaration>().none())

	let decl = ParsingFile.extractUnsafe(pf,fnName)

	if (!decl || decl.decl.type != DeclarationType.FUNCTION) {
		ctx.logErrors()
		throw new Error('failed to compile corelib function')
	}

	return decl.decl

}
