
import { ASTNodeType, ASTFnNode, ASTLetNode, ASTStaticDeclaration, astError, ASTExportNode } from "../syntax/AST";
import { Declaration, FnDeclaration, DeclarationType, VarDeclaration, DeclarationWrapper } from "./Declaration";
import { tokenToType, ElementaryValueType, hasSharedType } from "./Types";
import { exhaust } from "../toolbox/other";
import { ParsingFile } from "../toolbox/ParsingFile";
import { Fetcher } from "../codegen/Datapack";
import { CompileContext } from "../toolbox/CompileContext";
import { Maybe, MaybeWrapper } from "../toolbox/Maybe";
import { exprParser } from "./expressionParser";
import { copyESR, getESRType, ESR, ESRType, IntESR } from "./ESR";
import { Scope } from "./Scope";
import { parseBody } from "./parseBody";

export function hoist(node:Exclude<ASTStaticDeclaration,ASTExportNode>,scope:Scope,ctx:CompileContext,fetcher:Fetcher): Maybe<true> {

	const maybe = new MaybeWrapper<true>()

	let symbols = scope.symbols

	switch (node.type) {

		case ASTNodeType.IMPORT: {
			/*let st = fetcher(pfile,node0.source)
			if (st.value) {
				if (Array.isArray(node0.imports)) {
					for (let t of node0.imports) {
						let declw = st.value.getDeclaration(t)
						if (!declw) {
							ctx.addError(t.error('source had no such export'))
							maybe.noWrap()
							break
						}
						maybe.merge(scope.symbols.declare({decl:declw.decl,token:t},ctx))
					}
				} else {
					maybe.merge(scope.symbols.declare({token:node0.imports,decl:st.value},ctx))
				}
			} else maybe.noWrap()*/
			break
		}

		case ASTNodeType.MODULE:
			throw new Error('wait modules oka')

		case ASTNodeType.DEFINE: {
			symbols.declareHoister(node.identifier,()=>{
				const maybe = new MaybeWrapper<Declaration>()

				let esr0 = exprParser(node.initial,scope,ctx,false)

				let type = tokenToType(node.varType,symbols)
				if (type.elementary && type.type == ElementaryValueType.VOID) {
					ctx.addError(node.varType.error(`Cannot declare a variable of type 'void'`))
					return maybe.none()
				}
				if (!type.elementary) node.varType.throwDebug('no non-elemn rn k')

				if (maybe.merge(esr0)) return maybe.none()
				let res = copyESR(esr0.value,ctx,scope,node.identifier.value,{tmp:false,mutable:true,const:false})
				let esr = res.esr
				// do something with res.copyInstr
				
				if (!hasSharedType(getESRType(esr),type)) {
					ctx.addError(node.identifier.error('type mismatch'))
					return maybe.none()
				}

				return maybe.wrap({type:DeclarationType.VARIABLE,varType:type,esr})
				
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
