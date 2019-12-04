"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
var ElementaryValueType;
(function (ElementaryValueType) {
    ElementaryValueType[ElementaryValueType["INT"] = 0] = "INT";
    ElementaryValueType[ElementaryValueType["BOOL"] = 1] = "BOOL";
    ElementaryValueType[ElementaryValueType["VOID"] = 2] = "VOID";
})(ElementaryValueType = exports.ElementaryValueType || (exports.ElementaryValueType = {}));
function tokenToType(token, symbols) {
    if (token.type == Token_1.TokenType.TYPE) {
        let type = token.value.toUpperCase();
        if (!(type in ElementaryValueType))
            throw new Error('missing elementary value for ' + type);
        return { elementary: true, type: ElementaryValueType[type] };
    }
    throw new Error('only elementary types for now');
    // let decl = symbols.getDeclaration(token)
}
exports.tokenToType = tokenToType;
function getSharedType(...v) {
    if (v.some(vt => vt.elementary != v[0].elementary))
        return false;
    if (v[0].elementary)
        return v.every(vt => vt.type == v[0].type);
    throw new Error('no non-elementaries for now');
}
exports.getSharedType = getSharedType;
//# sourceMappingURL=Types.js.map