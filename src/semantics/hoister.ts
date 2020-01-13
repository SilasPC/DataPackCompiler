
import { ASTNodeType, ASTFnNode, ASTLetNode, ASTStaticDeclaration, astError, ASTExportNode, ASTStatement } from "../syntax/AST";
import { Declaration, FnDeclaration, DeclarationType, VarDeclaration, DeclarationWrapper } from "./Declaration";
import { tokenToType, ElementaryValueType, hasSharedType, ValueType } from "./Types";
import { exhaust } from "../toolbox/other";
import { ParsingFile } from "../toolbox/ParsingFile";
import { Fetcher } from "../codegen/Datapack";
import { CompileContext } from "../toolbox/CompileContext";
import { Maybe, MaybeWrapper } from "../toolbox/Maybe";
import { exprParser } from "./expressionParser";
import { copyESR, getESRType, ESR, ESRType, IntESR } from "./ESR";
import { Scope } from "./Scope";
import { parseBody } from "./parseBody";
import { parseDefine } from "./statements/parseDefine";

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

		case ASTNodeType.DEFINE: {
			let node0 = node
			symbols.declareHoister(node.identifier,()=>{
				const maybe = new MaybeWrapper<Declaration>()
				let res = parseDefine(node0,scope,ctx)
				if (res.value) {
					// use this
					res.value.copyInstr
				}
				return res.pick('decl')
			},ctx)
			break
		}

		case ASTNodeType.FUNCTION: {
			symbols.declareHoister(node.identifier,(earlyReplace)=>{
				const maybe = new MaybeWrapper<Declaration>()

				let parameters: Maybe<{param:ESR,ref:boolean}>[] = []
				let branch = scope.branch(node.identifier.value,'FN',null)
				let fn = ctx.createFnFile(branch.getScopeNames())
				let type = tokenToType(node.returnType,symbols)
				if (!type.elementary) {
					ctx.addError(node.returnType.error('nop thx'))
					return maybe.none()
				}

				let esr: ESR
				switch (type.type) {
					case ElementaryValueType.VOID:
						esr = {type:ESRType.VOID, mutable: false, const: false, tmp: false}
						break
					case ElementaryValueType.INT:
						esr = {type:ESRType.INT, mutable: false, const: false, tmp: false, scoreboard: ctx.scoreboards.getStatic('return',branch)}
						break
					case ElementaryValueType.BOOL:
						esr = {type:ESRType.BOOL, mutable: false, const: false, tmp: false, scoreboard: ctx.scoreboards.getStatic('return',branch)}
						break
					default:
						return exhaust(type.type)
				}
				branch.setReturnVar(esr)
				let fndecl: FnDeclaration = {
					type: DeclarationType.FUNCTION,
					returns: esr,
					fn,
					parameters
				}
				earlyReplace(fndecl)
				for (let param of node.parameters) {
					let maybe2 = new MaybeWrapper<{ref:boolean,param:ESR}>()
					let type = tokenToType(param.type,symbols)
					if (!type.elementary) {
						ctx.addError(param.type.error('elementary only thx'))
						parameters.push(maybe2.none())
						continue
					}
					let esr
					switch (type.type) {
						case ElementaryValueType.VOID:
							ctx.addError(param.type.error('not valid'))
							parameters.push(maybe2.none())
							continue
						case ElementaryValueType.INT:
							let iesr: IntESR = {
								type: ESRType.INT,
								scoreboard: ctx.scoreboards.getStatic(param.symbol.value,branch),
								mutable: param.ref, // this controls if function parameters are mutable
								const: false,
								tmp: false
							}
							esr = iesr
							break
						case ElementaryValueType.BOOL:
							ctx.addError(param.type.error('no bool yet thx'))
							parameters.push(maybe2.none())
							continue
						default:
							return exhaust(type.type)
					}
					let decl: VarDeclaration = {
						type: DeclarationType.VARIABLE,
						varType: type,
						esr
					}
					parameters.push(maybe2.wrap({param:esr,ref:param.ref}))
					maybe.merge(branch.symbols.declareDirect(param.symbol,decl,ctx))
				}
				if (maybe.merge(parseBody(node.body,branch,ctx)))
					return maybe.none()

				fn.add(...branch.mergeBuffers())

				return maybe.wrap(fndecl)

			},ctx)
			
			
			break
		}

		default:
			return exhaust(node)

	}

	return maybe.wrap(true)
	
}
