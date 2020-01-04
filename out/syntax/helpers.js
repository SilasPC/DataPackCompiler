"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
const AST_1 = require("./AST");
function getType(iter) {
    iter.next().expectType(Token_1.TokenType.MARKER).expectValue(':');
    return iter.next().expectType(Token_1.TokenType.SYMBOL, Token_1.TokenType.TYPE);
}
exports.getType = getType;
function wrapExport(node, keyword) {
    if (keyword) {
        let ret = { type: AST_1.ASTNodeType.EXPORT, keyword, node };
        return ret;
    }
    return node;
}
exports.wrapExport = wrapExport;
//# sourceMappingURL=helpers.js.map