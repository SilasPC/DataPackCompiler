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
	if (pfile.status == 'parsing') return maybe.wrap(true) // throw new Error('circular parsing')

	pfile.status = 'parsing'

	let symbols = pfile
	let scope = pfile.scope
	let ast = pfile.getAST()
	
	for (let node of ast) {
		let shouldExport = false

		if (node.type == ASTNodeType.EXPORT) {
			node = node.node
			shouldExport = true
		}

		hoist(pfile,node,scope,ctx,fetcher)

	}

	// Check unused
	/*for (let [key,decl] of symbols.getUnreferenced().filter(([k])=>!pfile.hasExport(k)))
		ctx.addError(decl.token.warning('Unused'))*/

	pfile.status = 'parsed'

	maybe.merge(symbols.flushHoisters())
	ctx.initFn.add(...pfile.scope.mergeBuffers())

	return maybe.wrap(true)

}
