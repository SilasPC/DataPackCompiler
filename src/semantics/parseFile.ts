import { ParsingFile } from "../toolbox/ParsingFile"
import { CompileContext } from "../toolbox/CompileContext"
import { Fetcher } from "../api/Compiler"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { ASTNodeType } from "../syntax/AST"
import { PTModNode, PTKind, PTStatement, PTBody, ParseTreeStore } from "./ParseTree"
import { exhaust } from "../toolbox/other"
import { parseFunction } from "./statements/parseFunction"
import { ModDeclaration, Declaration } from "./Declaration"
import { parseDefine } from "./statements/parseDefine"
import { parseStruct } from "./statements/parseStruct"

export function parseFile(pf:ParsingFile,ctx:CompileContext,fetcher:Fetcher,store:ParseTreeStore): Maybe<true> {
	const maybe = new MaybeWrapper<true>()

	let scope = pf.scope
	
	if (pf.status == 'parsing' || pf.status == 'parsed') return maybe.wrap(true)
	pf.status = 'parsing'

	let ast = pf.getAST()
	
	for (let node of ast) {
		let shouldExport = false

		if (node.type == ASTNodeType.EXPORT) {
			node = node.node
			shouldExport = true
		}

		switch (node.type) {

			case ASTNodeType.IMPORT: {
				let node0 = node
				let fetched = false
				let mod: ModDeclaration | null = null
				if (Array.isArray(node.imports)) {
					for (let t of node.imports) {
						maybe.merge(scope.symbols.declareHoister(t,()=>{
							const maybe = new MaybeWrapper<Declaration>()
							if (fetched && !mod) return maybe.none()
							if (!mod) {
								fetched = true
								let rmod = fetcher(pf,node0.source)
								if (!rmod.value) return maybe.none()
								mod = rmod.value
							}
							return mod.symbols.getDeclaration(t,ctx.logger).pick('decl')
						},ctx.logger))
					}
				} else {
					maybe.merge(scope.symbols.declareHoister(node.imports,()=>fetcher(pf,node0.source),ctx.logger))
				}
				break
			}
	
			case ASTNodeType.MODULE:
				console.log('wait modules')
				break
	
			case ASTNodeType.DEFINE: {
				let node0 = node
				maybe.merge(scope.symbols.declareHoister(node.identifier,()=>{
					let res = parseDefine(node0,scope,ctx.logger)
					if (res.value)
						store.init.add(res.value.pt)
					return res.pick('decl')
				},ctx.logger))
				break
			}
	
			case ASTNodeType.FUNCTION: {
				let node0 = node
				maybe.merge(scope.symbols.declareHoister(node.identifier,()=>parseFunction(node0,scope,store,ctx.logger),ctx.logger))
				break
			}
	
			case ASTNodeType.RECIPE:
				console.log('wait recipe')
				break
	
			case ASTNodeType.STRUCT: {
				let node0 = node
				scope.symbols.declareHoister(node.identifier,()=>parseStruct(node0,scope,ctx),ctx.logger)
				break
			}

			case ASTNodeType.EVENT:
				console.log('wait event')
				break
				
			default:
				return exhaust(node)
	
		}

	}

	maybe.merge(scope.symbols.flushHoisters())

	pf.status = 'parsed'

	return maybe.wrap(true)

}
