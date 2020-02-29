import { PTExpr, ptExprToType } from "../semantics/ParseTree"
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
		for (let c of this.consume) {
			if (typeof c == 'string') {
				res.push(c)
				continue
			}
			let expr = parseExpression(c.expr,scope)
			if (result.merge(expr)) continue
			let pt = expr.getValue()
            res.push(pt)
            let typeMatchErr = checkTypeMatch(c.spec,ptExprToType(pt))
            if (typeMatchErr) {
                result.addError(new CompileError(typeMatchErr))
                continue
            }
		}
		return result.wrap(new CMDInterpolation(res))
	}

}

function checkTypeMatch(spec:SheetSpecial,type:ValueType): string | null {
    switch (spec) {
        case 'score':
            if (type.type == Type.INT) return null
            return `Interpolation of score requires an int`
        case 'id':
        case 'name':
        case 'text':
        case 'range':
        case 'int':
        case 'uint':
        case 'pint':
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
