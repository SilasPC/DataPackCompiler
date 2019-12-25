"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Types_1 = require("./Types");
const other_1 = require("../toolbox/other");
const Instructions_1 = require("../codegen/Instructions");
var ESRType;
(function (ESRType) {
    ESRType[ESRType["VOID"] = 0] = "VOID";
    ESRType[ESRType["INT"] = 1] = "INT";
    ESRType[ESRType["BOOL"] = 2] = "BOOL";
})(ESRType = exports.ESRType || (exports.ESRType = {}));
function getESRType(esr) {
    switch (esr.type) {
        case ESRType.VOID: return { elementary: true, type: Types_1.ElementaryValueType.VOID };
        case ESRType.INT: return { elementary: true, type: Types_1.ElementaryValueType.INT };
        case ESRType.BOOL: return { elementary: true, type: Types_1.ElementaryValueType.BOOL };
        default:
            return other_1.exhaust(esr);
    }
}
exports.getESRType = getESRType;
/** Assigns one esr var to another */
function assignESR(from, to) {
    if (!Types_1.hasSharedType(getESRType(from), getESRType(to)))
        throw new Error('cannot assign esrs, not same type');
    switch (from.type) {
        case ESRType.VOID:
            throw new Error('cannot assign void esr');
        case ESRType.BOOL:
            throw new Error('no assign bool esr yet');
        case ESRType.INT: {
            return [{
                    type: Instructions_1.InstrType.INT_OP,
                    from,
                    into: to,
                    op: '='
                }];
        }
        default:
            return other_1.exhaust(from);
    }
}
exports.assignESR = assignESR;
/** Copies esr into a new esr (with the returned instruction) */
function copyESRToLocal(esr, ctx, scope, name) {
    switch (esr.type) {
        case ESRType.VOID:
            throw new Error('cannot copy void esr');
        case ESRType.BOOL:
            throw new Error('bool copy not supported yet');
        case ESRType.INT:
            let retEsr = { type: ESRType.INT, mutable: false, const: false, tmp: false, scoreboard: ctx.scoreboards.getStatic(name, scope) };
            let copyInstr = { type: Instructions_1.InstrType.INT_OP, into: retEsr, from: esr, op: '=' };
            return { copyInstr, esr: retEsr };
        default:
            return other_1.exhaust(esr);
    }
}
exports.copyESRToLocal = copyESRToLocal;
//# sourceMappingURL=ESR.js.map