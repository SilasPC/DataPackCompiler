"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../AST");
const expressionSyntaxParser_1 = require("../expressionSyntaxParser");
const helpers_1 = require("../helpers");
const Token_1 = require("../../lexing/Token");
function parseDeclaration(iter, ctx) {
    // allow destructured assignment?   let a,b,c = 1,2,3
    // or like this?                    let [a,b,c] = [1,2,3]
    // allow multi assignment?          let a = 1, b = 2, c = 3
    let letToken = iter.current();
    let symbol = iter.next().expectType(Token_1.TokenType.SYMBOL);
    let type = helpers_1.getType(iter);
    iter.next().expectType(Token_1.TokenType.OPERATOR).expectValue('=');
    let initial = expressionSyntaxParser_1.expressionSyntaxParser(iter, ctx).ast;
    // iter.next().expectSemiColon() // needed?
    return {
        type: AST_1.ASTNodeType.DEFINE,
        identifier: symbol,
        varType: type,
        keyword: letToken,
        initial
    };
}
exports.parseDeclaration = parseDeclaration;
//# sourceMappingURL=declaration.js.map