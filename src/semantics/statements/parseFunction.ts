import { ASTFnNode } from "../../syntax/AST";
import { MaybeWrapper, Maybe } from "../../toolbox/Maybe";
import { FnDeclaration, DeclarationType, VarDeclaration, Declaration } from "../declarations/Declaration";
import { tokenToType, Type } from "../types/Types";
import { Logger } from "../../toolbox/Logger";
import { ModScope } from "../Scope";
import { parseBody } from "../parseBody";
import { TokenI, DirectiveToken } from "../../lexing/Token";
import { CompilerOptions } from "../../toolbox/config";
import { FunctionStore } from "../managers/FunctionStore";
import { DirectiveList } from "../directives";
import { exhaust } from "../../toolbox/other";

export function parseFunction(dirs: DirectiveList,node:ASTFnNode,modScope:ModScope,store:FunctionStore,log:Logger,cfg:CompilerOptions): Maybe<FnDeclaration> {
	const maybe = new MaybeWrapper<FnDeclaration>()

	for (let {value, token} of dirs) {
		switch (value) {
			case 'debug': break
			case 'todo':
				log.addWarning(token.error('function not fully implemented'))
				break
			case 'tick':
			case 'load':
				log.addError(token.error('not available for functions'))
				maybe.noWrap()
				break
			case 'inline':
				log.addWarning(token.error('inline not supported yet'))
				break
			default: return exhaust(value)
		}
	}

	if (!node.returnType) {
		log.addError(node.identifier.error('no fn infer'))
		return maybe.none()
	}

	let type = tokenToType(node.returnType,modScope.symbols)

	let namePath: readonly string[] = modScope.nameAppend(node.identifier.value)

	const parameters: FnDeclaration['parameters'] = []
	const paramDecls: [TokenI,Declaration][] = []

	for (let param of node.parameters) {
		let type = tokenToType(param.type,modScope.symbols)
		let decl: VarDeclaration = {
			type: DeclarationType.VARIABLE,
			varType: type,
			mutable: false, // controls parameter mutability
			namePath: namePath.concat(param.symbol.value)
		}
		parameters.push({type,isRef:param.ref})
		paramDecls.push([param.symbol,decl])
	}

	const fndecl: FnDeclaration = {
		type: DeclarationType.FUNCTION,
		returns: type,
		parameters,
		thisBinding: {type:Type.VOID},
		namePath
	}

	const scope = modScope.branchToFn(node.identifier.value,fndecl)

	for (let [t,d] of paramDecls)
		maybe.merge(scope.symbols.declareDirect(t,d,log))

	let res = parseBody(node.body,scope,log,cfg)
	if (!res.value) return maybe.none()


	store.addFn(fndecl,res.value)

	return maybe.wrap(fndecl)

}
