import { ParsingFile } from "../toolbox/ParsingFile"
import { ASTNode, ASTNodeType, ASTOpNode, astErrorMsg, ASTStatement, astWarning } from "../syntax/AST"
import { ESR, ESRType, getESRType, IntESR, copyESR, assignESR } from "./ESR"
import { tokenToType, ElementaryValueType, ValueType, hasSharedType } from "./Types"
import { DeclarationType, VarDeclaration, FnDeclaration, DeclarationWrapper, Declaration } from "./Declaration"
import { exprParser } from "./expressionParser"
import { exhaust } from "../toolbox/other"
import { CompileContext } from "../toolbox/CompileContext"
import { Scope } from "./Scope"
import { InstrType } from "../codegen/Instructions"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { CompileError } from "../toolbox/CompileErrors"
import { Fetcher } from "../codegen/Datapack"
import { hoist } from "./hoister"

export function semanticsParser(pfile:ParsingFile,ctx:CompileContext,fetcher:Fetcher): Maybe<true> {

	const maybe = new MaybeWrapper<true>()
	
	if (pfile.status == 'parsed') return maybe.wrap(true)
	if (pfile.status == 'parsing') throw new Error('circular parsing')

	pfile.status = 'parsing'

	let symbols = pfile.getSymbolTable()
	let scope = pfile.scope
	let ast = pfile.getAST()
	
	for (let node0 of ast) {
		let shouldExport = false

		if (node0.type == ASTNodeType.EXPORT) {
			node0 = node0.node
			shouldExport = true
		}

		hoist(node0,scope,ctx,fetcher)

	}

	// Check unused
	/*for (let [key,decl] of symbols.getUnreferenced().filter(([k])=>!pfile.hasExport(k)))
		ctx.addError(decl.token.warning('Unused'))*/

	pfile.status = 'parsed'

	maybe.merge(symbols.flushHoisters())
	return maybe.wrap(true)

}
