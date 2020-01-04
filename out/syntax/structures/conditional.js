"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../AST");
const Token_1 = require("../../lexing/Token");
const expressionSyntaxParser_1 = require("../expressionSyntaxParser");
const bodySyntaxParser_1 = require("../bodySyntaxParser");
function parseConditional(iter, ctx) {
    let ifToken = iter.current();
    iter.next().expectType(Token_1.TokenType.MARKER).expectValue('(');
    let expression = expressionSyntaxParser_1.expressionSyntaxParser(iter, ctx).ast;
    iter.next().expectType(Token_1.TokenType.MARKER).expectValue(')');
    let primaryBranch = bodySyntaxParser_1.bodyOrLineSyntaxParser(iter, ctx);
    let secondaryBranch = [];
    let elseToken = null;
    if (iter.peek().type == Token_1.TokenType.KEYWORD && iter.peek().value == 'else') {
        elseToken = iter.next();
        secondaryBranch = bodySyntaxParser_1.bodyOrLineSyntaxParser(iter, ctx);
    }
    return {
        type: AST_1.ASTNodeType.CONDITIONAL,
        expression,
        primaryBranch,
        secondaryBranch,
        keyword: ifToken,
        keywordElse: elseToken
    };
}
exports.parseConditional = parseConditional;
//# sourceMappingURL=conditional.js.map