import { PTExpr, ptExprToType, knownAtCompileTime } from "../semantics/ParseTree"
import { Scope } from "../semantics/Scope"
import { Result, ResultWrapper } from "../toolbox/Result"
import { parseExpression } from "../semantics/expressionParser"
import { ParsedSyntax } from "./CMDNode"
import { SheetSpecial } from "./sheetParser"
import { ValueType, Type } from "../semantics/types/Types"
import { exhaust } from "../toolbox/other"
import { CompileError } from "../toolbox/CompileErrors"

export class CMDInterpolation {

    constructor (
        public readonly interpolation: (string|PTExpr)[]
    ) {}

    join(f:(pt:PTExpr)=>string): string {
        return this.interpolation.map(
            i => typeof i == 'string'
                ?   i
                :   f(i)
        ).join('')
    }

}

export class SemanticsInterpretor {

	constructor (
		private readonly consume: readonly ParsedSyntax[]
	) {}

	containsSemantics() {
		return this.consume.some(c=>typeof c != 'string')
	}

	interpretNoSemantics(): string {
		if (!this.containsSemantics())
			throw new Error('consume contains semantical information when interpretNoSemantics() was called')
		return this.consume.join('')
	}

	interpret(scope:Scope): Result<CMDInterpolation,null> {
		const result = new ResultWrapper<CMDInterpolation,null>()
		let res: (string|PTExpr)[] = []
		for (let i = 0; i < this.consume.length; i++) {
            let c = this.consume[i]
			if (typeof c == 'string') {
				res.push(c)
				continue
			}
			let expr = parseExpression(c.expr,scope)
			if (result.merge(expr)) continue
			let pt = expr.getValue()
            let ins = insert(c.spec,pt,i < this.consume.length - 1)
            if (ins instanceof CompileError) {
                result.addError(ins)
                continue
            }
            res.push(ins)
		}
		return result.wrap(new CMDInterpolation(res))
	}

}

function insert(spec:SheetSpecial,pt:PTExpr,addSpace:boolean): CompileError | PTExpr | string {
    const type = ptExprToType(pt)
    const value = knownAtCompileTime(pt)
    const unknown = new CompileError(`Parameter needs to be known at compile time`)
    switch (spec) {
        case 'score':
            if (type.type != Type.INT) return new CompileError(`Interpolation of score requires an int`)
            return pt
        case 'int':
        case 'uint':
        case 'pint':
            if (type.type != Type.INT) return new CompileError(`Interpolation requires an int`)
            if (!value) return unknown
            if (value.type != Type.INT) throw new Error('precalculated type does not match ptexpr type')
            switch (spec) {
                case 'pint': 
                    if (value.value <= 0) return new CompileError(`Integer needs to be positive`)
                case 'uint':
                    if (value.value < 0) return new CompileError(`Integer needs to be unsigned`)
                case 'int':
                    break
                default: return exhaust(spec)
            }
            return value.value + (addSpace ? ' ' : '')
        case 'id':
        case 'name':
        case 'text':
        case 'range':
        case 'float':
        case 'ufloat':
        case 'player':
        case 'players':
        case 'entity':
        case 'entities':
        case 'coords':
        case 'coords2':
        case 'json':
        case 'nbtpath':
        case 'time':
        case 'nbt':
        case 'block':
        case 'item':
            return `Interpolation not supported for '${spec}'`
        default: return exhaust(spec)
    }
}
