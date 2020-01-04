"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
const AST_1 = require("./AST");
const expressionSyntaxParser_1 = require("./expressionSyntaxParser");
const conditional_1 = require("./structures/conditional");
const declaration_1 = require("./structures/declaration");
const other_1 = require("../toolbox/other");
function bodyOrLineSyntaxParser(iter, ctx) {
    if (iter.next().type == Token_1.TokenType.MARKER && iter.current().value == '{')
        return bodySyntaxParser(iter, ctx);
    else
        return [lineSyntaxParser(iter, ctx)];
}
exports.bodyOrLineSyntaxParser = bodyOrLineSyntaxParser;
function bodySyntaxParser(iter, ctx) {
    let body = [];
    loop: for (let token of iter) {
        if (token.type == Token_1.TokenType.MARKER && token.value == '}')
            return body;
        body.push(lineSyntaxParser(iter, ctx));
    }
    throw new Error('body ran out, end of file');
}
exports.bodySyntaxParser = bodySyntaxParser;
function lineSyntaxParser(iter, ctx) {
    const token = iter.current();
    switch (token.type) {
        case Token_1.TokenType.KEYWORD: {
            switch (token.value) {
                case 'let': return declaration_1.parseDeclaration(iter, ctx);
                case 'if': return conditional_1.parseConditional(iter, ctx);
                case 'return': {
                    // Later on, the expression parser must return a void type instead
                    // This should happen, as it should be able to parse everything
                    // using the shunting-yard algorithm
                    // That is a bit ambitious, but it sounds quite neat :D
                    // That also makes all this redundant anyways
                    if (iter.peek().type == Token_1.TokenType.MARKER && iter.peek().value == ';')
                        return {
                            type: AST_1.ASTNodeType.RETURN,
                            keyword: token,
                            node: null
                        };
                    else
                        return {
                            type: AST_1.ASTNodeType.RETURN,
                            keyword: token,
                            node: expressionSyntaxParser_1.expressionSyntaxParser(iter, ctx).ast
                        };
                }
                default:
                    // ehm. I don't think I've implemented keywords in the expr parser
                    // lol
                    throw new Error('keywords cannot be passed to expr parser yet');
                    return expressionSyntaxParser_1.expressionSyntaxParser(iter.skip(-1), ctx).ast;
            }
            // return exhaust(token.value)
        }
        case Token_1.TokenType.COMMAND:
            return ctx.syntaxSheet.readSyntax(iter.current(), ctx);
        case Token_1.TokenType.OPERATOR:
        case Token_1.TokenType.PRIMITIVE:
        case Token_1.TokenType.SYMBOL:
            return expressionSyntaxParser_1.expressionSyntaxParser(iter.skip(-1), ctx).ast;
        case Token_1.TokenType.MARKER:
            switch (token.value) {
                case ';': break;
                default:
                    return token.throwDebug('unexpected marker');
            }
        case Token_1.TokenType.MARKER:
        case Token_1.TokenType.TYPE:
            return token.throwDebug('unexpected');
        default:
            return other_1.exhaust(token.type);
    }
}
exports.lineSyntaxParser = lineSyntaxParser;
//# sourceMappingURL=bodySyntaxParser.js.map