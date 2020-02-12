
import { FnDeclaration, DeclarationType, fnSignature } from "../semantics/declarations/Declaration";
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
	generateBody(init,store.init,om)

	// functions
	for (let [decl,body] of store.fnEntries()) {
		let typename = decl.thisBinding.type == Type.VOID ? 'Function' : 'Method'
		let fnf = om.functions.byDeclaration(decl)
		fnf.setHeader([
			`${typename} definition`,
			`Signature: ${fnSignature(decl)}`
		])
		generateBody(fnf,body,om)
	}

	// events
	for (let [decl,bodies] of store.eventEntries()) {
		let fnf = om.functions.byDeclaration(decl)
		fnf.setHeader([
			`Event definition`
		])
		for (let body of bodies)
			generateBody(fnf,body,om)
	}

}

function generateBody(fnf:FnFile,fn:PTBody,om:OutputManager): void {

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

function generateExpr(fnf:FnFile,pt:PTExpr,om:OutputManager): Scoreboard | null {
	switch (pt.kind) {
		case PTKind.VARIABLE:
			if (pt.decl.varType.type != Type.INT) throw new Error('fak u')
			return om.scoreboards.getDecl(pt.decl)

		case PTKind.PRIMITIVE:
			if (pt.value.type != Type.INT) throw new Error('fak u')
			let sb = om.scoreboards.getConstant(pt.value.value)
			return sb

		case PTKind.INVOKATION:
			if (pt.func.thisBinding.type != Type.VOID) throw new Error('no method gen plz')
			for (let i = 0; i < pt.args.length; i++) {
				let arg = pt.args[i]
				let param = pt.func.parameters[i]
				if (param.type.type != Type.INT) throw new Error('only int param rn')
				if (arg.ref != param.isRef) throw new Error('codegen: invokation param ref did not match argument ref')
				//generateExpr(fnf,arg.pt,om,/*var to write to: param scoreboard*/)
			}
			fnf.push({
				type: InstrType.INVOKE,
				fn: om.functions.byDeclaration(pt.func)
			})
			for (let arg of pt.args) {
				// ref back-set
			}
			if (pt.func.returns.type == Type.VOID) return null
			if (pt.func.returns.type != Type.INT) throw new Error('only void or int return rn')
			return om.scoreboards.getDecl(pt.func)

		case PTKind.OPERATOR:
			return genOp(fnf,pt,om)
			
		default: return exhaust(pt)
	}
}

function genOp(fnf:FnFile,pt:PTOpNode,om:OutputManager): Scoreboard {
	if (pt.type.type != Type.INT) throw new Error('only intz')
	switch (pt.op) {
		case '+':
		case '-':
		case '%':
		case '/':
		case '*': {
			let tmp = om.scoreboards.getStatic(pt.scopeNames.concat('tmp'))
			let [o0,o1] = pt.vals.map(expr=>generateExpr(fnf,expr,om))
			if (!o0||!o1) throw new Error('operands did not have the expected type (non void rn)')
			fnf.push(
				{type:InstrType.INT_OP,into:tmp,from:o0,op:'='},
				{type:InstrType.INT_OP,into:tmp,from:o1,op:pt.op+'='}
			)
			return tmp
		}
		case '+=':
		case '-=':
		case '%=':
		case '/=':
		case '*=': {
			let [o0,o1] = pt.vals.map(expr=>generateExpr(fnf,expr,om))
			if (!o0||!o1) throw new Error('operands did not have the expected type (non void rn)')
			fnf.push({type:InstrType.INT_OP,into:o0,from:o1,op:pt.op})
			return o0
		}
		case '++':
		case '--': {
			// TODO: here we must differentiate between pre- and postfix operator
			let o = generateExpr(fnf,pt.vals[0],om)
			if (!o) throw new Error('operands did not have the expected type (non void rn)')
			let one = om.scoreboards.getConstant(1)
			fnf.push({type:InstrType.INT_OP,into:o,from:one,op:pt.op[0]+'='})
			return o
		}

		default:
			throw new Error('no other ops like comparators rn')
			//return exhaust(pt.op)
	}
}
