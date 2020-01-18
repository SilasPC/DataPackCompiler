
import { ASTNodeType, ASTFnNode, ASTLetNode, ASTStaticDeclaration, ASTExportNode, ASTStatement } from "../syntax/AST";
import { exhaust } from "../toolbox/other";
import { ParsingFile } from "../toolbox/ParsingFile";
import { Fetcher } from "../codegen/Datapack";
import { CompileContext } from "../toolbox/CompileContext";
import { Maybe, MaybeWrapper } from "../toolbox/Maybe";
import { Scope } from "./Scope";
import { parseDefine } from "./statements/parseDefine";
import { parseFunction } from "./statements/parseFunction";
import { parseStruct } from "./statements/parseStruct";

export function hoist(pf:ParsingFile,node:Exclude<ASTStaticDeclaration,ASTExportNode>,scope:Scope,ctx:CompileContext,fetcher:Fetcher): Maybe<true> {

	const maybe = new MaybeWrapper<true>()

	let symbols = scope.symbols

	switch (node.type) {

		case ASTNodeType.IMPORT: {
			let st = fetcher(pf,node.source)
			if (st.value) {
				if (Array.isArray(node.imports)) {
					for (let t of node.imports) {
						let declw = st.value.symbols.getDeclaration(t,ctx)
						if (maybe.merge(declw)) {
							maybe.none()
							continue
						}
						maybe.merge(scope.symbols.declareDirect(t,declw.value.decl,ctx))
					}
				} else {
					maybe.merge(scope.symbols.declareDirect(node.imports,st.value,ctx))
				}
			} else maybe.noWrap()
			break
		}

		case ASTNodeType.MODULE:
			throw new Error('wait modules oka')

		case ASTNodeType.DEFINE:
			symbols.declareHoister(node.identifier,()=>parseDefine(node,scope,ctx),ctx)
			break

		case ASTNodeType.FUNCTION:
			symbols.declareHoister(node.identifier,()=>parseFunction(node,scope,ctx,null),ctx)
			break

		case ASTNodeType.RECIPE:
			console.log('hoist recipe')
			break

		case ASTNodeType.STRUCT:
			symbols.declareHoister(node.identifier,()=>parseStruct(node,scope,ctx),ctx)
			break
			
		default:
			return exhaust(node)

	}

	return maybe.wrap(true)
	
}
