import { ASTFnNode } from "../../syntax/AST";
import { PTFnNode, ParseTree, PTKind, ParseTreeStore } from "../ParseTree";
import { MaybeWrapper, Maybe } from "../../toolbox/Maybe";
import { FnDeclaration, DeclarationType, VarDeclaration } from "../declarations/Declaration";
import { tokenToType, Type, ValueType } from "../types/Types";
import { Logger } from "../../toolbox/Logger";
import { Scope } from "../Scope";
import { parseBody } from "../parseBody";

export function parseFunction(node:ASTFnNode,scope:Scope,store:ParseTreeStore,log:Logger): Maybe<FnDeclaration> {
	const maybe = new MaybeWrapper<FnDeclaration>()

	const branch = scope.branch(node.identifier.value)

	if (!node.returnType) throw new Error('no fn infer')

	const parameters: FnDeclaration['parameters'] = []

	for (let param of node.parameters) {
		let type = tokenToType(param.type,scope.symbols)
		let decl: VarDeclaration = {
			type: DeclarationType.VARIABLE,
			varType: type,
			mutable: false, // controls parameter mutability
			namePath: branch.nameAppend(param.symbol.value)
		}
		parameters.push({type,isRef:param.ref})
		maybe.merge(branch.symbols.declareDirect(param.symbol,decl,log))
	}

	let res = parseBody(node.body,branch,log)
	if (!res.value) return maybe.none()
	
	const fndecl: FnDeclaration = {
		type: DeclarationType.FUNCTION,
		returns: tokenToType(node.returnType,scope.symbols),
		parameters,
		thisBinding: {type:Type.VOID},
		namePath: scope.nameAppend(node.identifier.value)
	}

	store.addFn(fndecl,res.value)

	return maybe.wrap(fndecl)

}