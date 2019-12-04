"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../AST");
const Token_1 = require("../../lexing/Token");
const expressionSyntaxParser_1 = require("../expressionSyntaxParser");
const bodySyntaxParser_1 = require("../bodySyntaxParser");
function parseConditional(iter) {
    iter.next().expectType(Token_1.TokenType.MARKER).expectValue('(');
    let expression = expressionSyntaxParser_1.expressionSyntaxParser(iter).ast;
    iter.next().expectType(Token_1.TokenType.MARKER).expectValue(')');
    iter.next().expectType(Token_1.TokenType.MARKER).expectValue('{'); // or expression here
    let primaryBranch = bodySyntaxParser_1.bodySyntaxParser(iter);
    let secondaryBranch = [];
    if (iter.peek().type == Token_1.TokenType.KEYWORD && iter.peek().value == 'else') {
        iter.skip(1);
        iter.next().expectType(Token_1.TokenType.MARKER).expectValue('{'); // or expression here
        secondaryBranch = bodySyntaxParser_1.bodySyntaxParser(iter);
    }
    return {
        type: AST_1.ASTNodeType.CONDITIONAL,
        expression,
        primaryBranch,
        secondaryBranch
    };
}
exports.parseConditional = parseConditional;
//# sourceMappingURL=conditional.js.map