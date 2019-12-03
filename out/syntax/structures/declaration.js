"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../AST");
const expressionSyntaxParser_1 = require("../expressionSyntaxParser");
const helpers_1 = require("../helpers");
const Token_1 = require("../../lexing/Token");
function parseDeclaration(iter) {
    let symbol = iter.next().expectType(Token_1.TokenType.SYMBOL);
    let type = helpers_1.getType(iter);
    iter.next().expectType(Token_1.TokenType.OPERATOR).expectValue('=');
    let initial = expressionSyntaxParser_1.expressionSyntaxParser(iter); //expressionSyntaxParser(iter)
    iter.next().expectSemiColon();
    return {
        type: AST_1.ASTNodeType.DEFINE,
        identifier: symbol,
        varType: type,
        initial
    };
}
exports.parseDeclaration = parseDeclaration;
//# sourceMappingURL=declaration.js.map