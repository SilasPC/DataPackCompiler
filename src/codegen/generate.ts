
import { FnDeclaration, DeclarationType, fnSignature } from "../semantics/Declaration";
import { exhaust } from "../toolbox/other";
import { InstrType, INT_OP } from "./Instructions";
import { FnFile } from "./FnFile";
import { OutputManager } from "./OutputManager";
import { PTExpr, PTKind, PTOpNode, PTBody, ParseTreeStore } from "../semantics/ParseTree";
import { Type } from "../semantics/types/Types";
import { Scoreboard } from "./ScoreboardManager";

export function generate(store:ParseTreeStore,om:OutputManager) {

	const init = om.functions.createFn(['std','init'])
	init.setHeader([`Datapack initialization`])
	generateFn(init,store.init,om)

	const done = new Set<FnDeclaration>()

	for (let [decl] of store.fnEntries())
		gen(decl)

	function gen(decl:FnDeclaration) {
		if (done.has(decl)) return
		const body = store.getBody(decl)
		if (!body) throw new Error('fn decl not registered')
		let typename = decl.thisBinding.type == Type.VOID ? 'Function' : 'Method'
		let fnf = om.functions.createFn(decl.namePath)
		fnf.setHeader([
			`${typename} definition`,
			`Signature: ${fnSignature(decl)}`
		])
		done.add(decl)
		generateFn(fnf,body,om)
		fnf.mergeBuffers(om,)
	}

}

function generateFn(fnf:FnFile,fn:PTBody,om:OutputManager): void {

	for (let [cmts,stmt] of fn.iterate()) {
		fnf.addComments(...cmts)
		switch (stmt.kind) {
			case PTKind.VARIABLE:
			case PTKind.PRIMITIVE:
			case PTKind.OPERATOR:
			case PTKind.INVOKATION:
				generateExpr(fnf,stmt,om)
				break
			case PTKind.COMMAND:
				fnf.push({
					type: InstrType.CMD,
					raw: stmt.raw
				})
				break
			case PTKind.WHILE:
			case PTKind.CONDITIONAL:
				break
			default: return exhaust(stmt)
		}
	}

}

function generateExpr(fnf:FnFile,pt:PTExpr,om:OutputManager): Scoreboard {
	switch (pt.kind) {
		case PTKind.VARIABLE:
			if (pt.decl.varType.type != Type.INT) throw new Error('fak u')
			return om.scoreboards.getDecl(pt.decl)
		case PTKind.PRIMITIVE:
			if (pt.value.type != Type.INT) throw new Error('fak u')
			return om.scoreboards.getConstant(pt.value.value)
		case PTKind.INVOKATION:
			throw new Error('noooooop')
		case PTKind.OPERATOR:
			return genOp(fnf,pt,om)
		default: return exhaust(pt)
	}
}

function genOp(fnf:FnFile,pt:PTOpNode,om:OutputManager): Scoreboard {
	if (pt.type.type != Type.INT) throw new Error('fuck dig')
	switch (pt.op) {
		case '+':
		case '-':
		case '%':
		case '/':
		case '*': {
			let tmp = om.scoreboards.getStatic(pt.scopeNames.concat('tmp'))
			let [o0,o1] = pt.vals.map(expr=>generateExpr(fnf,expr,om))
			let setInstr: INT_OP = {type:InstrType.INT_OP,into:tmp,from:o0,op:'='}
			let opInstr: INT_OP = {type:InstrType.INT_OP,into:tmp,from:o1,op:pt.op+'='}
			fnf.push(setInstr,opInstr)
			return tmp
		}
		case '+=':
		case '-=':
		case '%=':
		case '/=':
		case '*=': {
			let [o0,o1] = pt.vals.map(expr=>generateExpr(fnf,expr,om))
			let opInstr: INT_OP = {type:InstrType.INT_OP,into:o0,from:o1,op:pt.op}
			fnf.push(opInstr)
			return o0
		}
		case '++':
		case '--': {
			let o = generateExpr(fnf,pt.vals[0],om)
			let one = om.scoreboards.getConstant(1)
			let opInstr: INT_OP = {type:InstrType.INT_OP,into:o,from:one,op:pt.op[0]+'='}
			fnf.push(opInstr)
			return o
		}

		default:
			throw new Error('hahaha')
			//return exhaust(pt.op)
	}
}
