import { CompileContext } from "../toolbox/CompileContext";
import { FnDeclaration, DeclarationType, ModDeclaration } from "../semantics/Declaration";
import { lexer } from "../lexing/lexer";
import { fileSyntaxParser } from "../syntax/fileSyntaxParser";
import { parseFile } from "../semantics/parseFile";
import { MaybeWrapper } from "../toolbox/Maybe";
import { ParsingFile } from "../toolbox/ParsingFile";
import { parseFunction } from "../semantics/statements/parseFunction";
import { ASTNodeType } from "../syntax/AST";
import { ValueType } from "../semantics/types/Types";

export function compileStdlibFunction(
	fn:string,
	fnName:string,
	ctx:CompileContext,
	methodBinding: ValueType | null
): FnDeclaration {

	let pf = ctx.loadFromSource(fn,'stdlib')
	
	lexer(pf,ctx)
	fileSyntaxParser(pf,ctx)
	//parseFile(pf,ctx,()=>{throw new Error('no fetch in stdlib')})
	
	throw new Error('wait std lib')

	/*if (!decl.value || decl.value.type != DeclarationType.FUNCTION) {
		ctx.logErrors()
		throw new Error(`failed to compile stdlib function '${fnName}'`)
	}

	return decl.value*/

}
