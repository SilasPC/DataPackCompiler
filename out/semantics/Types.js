"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
const unionize_1 = require("unionize");
exports.ValueTypes = unionize_1.unionize({
    ELEMENTARY: unionize_1.ofType(),
    NON_ELEMENTARY: {}
}, {
    value: 'type'
});
var ElementaryValueType;
(function (ElementaryValueType) {
    ElementaryValueType[ElementaryValueType["INT"] = 0] = "INT";
    ElementaryValueType[ElementaryValueType["VOID"] = 1] = "VOID";
})(ElementaryValueType = exports.ElementaryValueType || (exports.ElementaryValueType = {}));
function tokenToType(token, symbols) {
    if (token.type == Token_1.TokenType.TYPE) {
        let type = token.value.toUpperCase();
        if (!(type in ElementaryValueType))
            throw new Error('missing elementary value for ' + type);
        return exports.ValueTypes.ELEMENTARY(ElementaryValueType[type]);
    }
    let decl = symbols.getDeclaration(token.value);
    if (!decl)
        token.throwDebug('Type not defined');
    throw new Error('only elementary types for now');
}
exports.tokenToType = tokenToType;
//# sourceMappingURL=Types.js.map