
import { fnSignature, DeclarationType } from "../semantics/declarations/Declaration";
import { exhaust } from "../toolbox/other";
import { InstrType } from "./Instructions";
import { FnFile } from "./FnFile";
import { OutputManager } from "./managers/OutputManager";
import { PTExpr, PTKind, PTOpNode, PTBody } from "../semantics/ParseTree";
import { Type } from "../semantics/types/Types";
import { Scoreboard } from "./managers/ScoreboardManager";
import { ProgramManager } from "../semantics/managers/ProgramManager";

export function generate(program: ProgramManager, om: OutputManager) {

	const init = om.functions.createFn(['std','init'])
	init.setHeader([`Datapack initialization`])
	generateBody(init,program.fnStore.init,om)

	// functions
	for (let [decl,body] of program.fnStore.fnEntries()) {
		let typename = decl.thisBinding.type == Type.VOID ? 'Function' : 'Method'
		let fnf = om.functions.byDeclaration(decl)
		fnf.setHeader([
			`${typename} definition`,
			`Signature: ${fnSignature(decl)}`
		])
		generateBody(fnf,body,om)
	}

	// events
	for (let [decl,bodies] of program.fnStore.eventEntries()) {
		let fnf = om.functions.byDeclaration(decl)
		fnf.setHeader([
			`Event definition`
		])
		for (let body of bodies)
			generateBody(fnf,body,om)
	}

	// standard tags
	;[...program.tickEvents].map(x=>om.functions.byDeclaration(x)).forEach(x=>om.tags.tick.add(x))
	;[...program.loadEvents].map(x=>om.functions.byDeclaration(x)).forEach(x=>om.tags.load.add(x))

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
					//raw: stmt.raw
					// temporary ignore expr:
					// raw: stmt.interpolations.filter(i => typeof i == 'string').join('')
					raw: stmt.interpolations.join(pt=>{
						let res = generateExpr(fnf,pt,om)
						if (!res) throw new Error('lul')
						return `${res.selector} ${res.scoreboard} `
					})
				})
				break
			case PTKind.RETURN:
				let fn = stmt.fn
				if (fn.returns.type != Type.VOID) {
					if (fn.returns.type != Type.INT && fn.returns.type != Type.BOOL) throw new Error('no return: '+Type[fn.returns.type])
					if (!stmt.expr) throw new Error('return value non-void, but no expr')
					let ret = om.scoreboards.getDecl(fn)
					let expr = generateExpr(fnf,stmt.expr,om)
					if (!expr) throw new Error('generate expression returned null for non-void')
					fnf.push({
						type: InstrType.INT_OP,
						into: ret,
						from: expr,
						op: '='
					})
				}
				fnf.pushFlowBuffer()
				break
			case PTKind.WHILE:
			case PTKind.CONDITIONAL:
				console.log('wait generate if,while')
				break
			default: return exhaust(stmt)
		}
	}

}

function generateExpr(fnf:FnFile,pt:PTExpr,om:OutputManager): Scoreboard | null {
	switch (pt.kind) {
		case PTKind.VARIABLE:
			if (pt.decl.varType.type != Type.INT && pt.decl.varType.type != Type.BOOL) throw new Error('fak u')
			return om.scoreboards.getDecl(pt.decl)

		case PTKind.PRIMITIVE:
			if (pt.value.type == Type.BOOL)
				return om.scoreboards.getConstant(pt.value.value ? 1 : 0)
			if (pt.value.type != Type.INT) throw new Error('fak u')
			return om.scoreboards.getConstant(pt.value.value)

		case PTKind.INVOKATION:
			if (pt.func.type == DeclarationType.EVENT) {
				fnf.push({
					type: InstrType.INVOKE,
					fn: om.functions.byDeclaration(pt.func)
				})
				return null
			}
			if (pt.func.thisBinding.type != Type.VOID) throw new Error('no method gen plz')
			for (let i = 0; i < pt.args.length; i++) {
				let arg = pt.args[i]
				let param = pt.func.parameters[i]
				if (param.type.type != Type.INT && param.type.type != Type.BOOL) throw new Error('only int/bool param rn')
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
			if (pt.func.returns.type != Type.INT && pt.func.returns.type != Type.BOOL) throw new Error('no return: '+Type[pt.func.returns.type])
			return om.scoreboards.getDecl(pt.func)

		case PTKind.OPERATOR:
			return genOp(fnf,pt,om)
			
		default: return exhaust(pt)
	}
}

function genOp(fnf:FnFile,pt:PTOpNode,om:OutputManager): Scoreboard {
	if (pt.type.type != Type.INT && pt.type.type != Type.BOOL) throw new Error('only intz n\' bools')
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

		case '=':
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

		case '<':
		case '>':
		case '<=':
		case '>=':
		case '!=':
		case '==': {
			let iff = true
			let op: string = pt.op
			if (op == '==') op = '='
			else if (op == '!=') {
				op = '='
				iff = false
			}
			let [o0,o1] = pt.vals.map(expr=>generateExpr(fnf,expr,om))
			if (!o0||!o1) throw new Error('operands did not have the expected type (non void rn)')
			let tmp = om.scoreboards.getStatic(pt.scopeNames.concat('tmp'))
			fnf.push({type:InstrType.CMD,raw:`scoreboard players set ${tmp.selector} ${tmp.scoreboard} 0`})
			fnf.push({type:InstrType.CMD,raw:`execute ${iff?'if':'unless'} score ${o0.selector} ${o0.scoreboard} ${pt.op} ${o1.selector} ${o1.scoreboard} run scoreboard players set ${tmp.selector} ${tmp.scoreboard} 1`})
			return tmp
		}

		default:
			throw new Error('no other ops like comparators rn: '+pt.op)
			//return exhaust(pt.op)
	}
}
