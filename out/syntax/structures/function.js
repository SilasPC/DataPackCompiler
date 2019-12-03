"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../AST");
const Token_1 = require("../../lexing/Token");
const bodySyntaxParser_1 = require("../bodySyntaxParser");
const helpers_1 = require("../helpers");
function parseFunction(iter) {
    let fnSymbol = iter.next().expectType(Token_1.TokenType.SYMBOL);
    let parameters = [];
    iter.next().expectType(Token_1.TokenType.MARKER).expectValue('(');
    while (iter.peek().type == Token_1.TokenType.SYMBOL) {
        let symbol = iter.next();
        let type = helpers_1.getType(iter);
        parameters.push({ symbol, type });
        let comma = iter.peek();
        if (comma.type != Token_1.TokenType.MARKER || comma.value != ',')
            break;
        iter.skip(1).peek().expectType(Token_1.TokenType.SYMBOL);
    }
    iter.next().expectType(Token_1.TokenType.MARKER).expectValue(')');
    let returnType = helpers_1.getType(iter);
    iter.next().expectType(Token_1.TokenType.MARKER).expectValue('{');
    let body = bodySyntaxParser_1.bodySyntaxParser(iter);
    return {
        type: AST_1.ASTNodeType.FUNCTION,
        identifier: fnSymbol,
        parameters,
        body,
        returnType
    };
}
exports.parseFunction = parseFunction;
//# sourceMappingURL=function.js.map