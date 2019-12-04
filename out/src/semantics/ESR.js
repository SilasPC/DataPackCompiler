"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Types_1 = require("./Types");
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
            const exhaust = esr;
    }
    throw new Error('exhaustion');
}
exports.getESRType = getESRType;
//# sourceMappingURL=ESR.js.map