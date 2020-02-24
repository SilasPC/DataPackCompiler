import { ASTEventNode } from "../../syntax/AST"
import { Scope } from "../Scope"
import { Logger } from "../../toolbox/Logger"
import { EventDeclaration, DeclarationType } from "../declarations/Declaration"
import { Program } from "../managers/ProgramManager"
import { Interspercer } from "../../toolbox/Interspercer"
import { DirectiveToken } from "../../lexing/Token"
import { DirectiveList } from "../directives"
import { exhaust } from "../../toolbox/other"
import { Result, ResultWrapper } from "../../toolbox/Result"
import { PTBody, PTKind, PTCallNode } from "../ParseTree"
import { parseBody } from "../parseBody"
import { CompilerOptions } from "../../toolbox/config"
import { resolveStatic } from "../resolveAccess"

export function parseEvent(dirs: DirectiveList, node: ASTEventNode, scope:Scope, program: Program, cfg: CompilerOptions): Result<EventDeclaration,null> {
	const result = new ResultWrapper<EventDeclaration,null>()

	let decl: EventDeclaration = {
		type: DeclarationType.EVENT,
        namePath: scope.nameAppend(node.identifier.value)
	}

	for (let {value, token} of dirs) {
		switch (value) {
			case 'debug': break
			case 'tick':
				program.setEventToTick(decl)
				break
			case 'load':
				program.setEventToLoad(decl)
				break
			case 'todo':
				result.addWarning(token.error('event not fully implemented'))
				break
			case 'inline':
				result.addError(token.error('not available for events'))
				break
			default: return exhaust(value)
		}
	}

	let body: PTBody
	if (!node.body) body = new Interspercer()
	else {
		let bodyRes = parseBody(node.body,scope,cfg)
		if (!result.merge(bodyRes)) {
			body = bodyRes.getValue()
		} else body = new Interspercer()
	}

	program.fnStore.appendToEvent(decl,body)

	if (node.extend) {
		let extDec = resolveStatic(node.extend.accessors,scope.symbols)
		if (!result.merge(extDec)) {
			let dec = extDec.getValue()
			if (dec.type == DeclarationType.EVENT) {
				let call: PTCallNode = {
					kind: PTKind.INVOKATION,
					func: decl,
					args: [],
					scopeNames: scope.getScopeNames()
				}
				let body: PTBody = new Interspercer()
				if (cfg.sourceMap) body.addSubData(...node.sourceMap())
				body.add(call)
				program.fnStore.appendToEvent(dec,body)
			} else result.addError(node.extend.error('not an event'))
		}
	}

	return result.wrap(decl) // use EnsuredResult later I think
	
}