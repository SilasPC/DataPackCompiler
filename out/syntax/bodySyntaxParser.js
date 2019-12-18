"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
const AST_1 = require("./AST");
const expressionSyntaxParser_1 = require("./expressionSyntaxParser");
const conditional_1 = require("./structures/conditional");
const declaration_1 = require("./structures/declaration");
const other_1 = require("../toolbox/other");
function bodySyntaxParser(iter, ctx) {
    let body = [];
    loop: for (let token of iter) {
        switch (token.type) {
            case Token_1.TokenType.KEYWORD: {
                switch (token.value) {
                    case 'let':
                        body.push(declaration_1.parseDeclaration(iter, ctx));
                        break;
                    case 'if':
                        body.push(conditional_1.parseConditional(iter, ctx));
                        break;
                    default:
                        // ehm. I don't think I've implemented keywords in the expr parser
                        // lol
                        body.push(expressionSyntaxParser_1.expressionSyntaxParser(iter.skip(-1), ctx).ast);
                        break;
                }
                break;
            }
            case Token_1.TokenType.COMMAND: {
                let node = {
                    type: AST_1.ASTNodeType.COMMAND,
                    cmd: iter.current().value
                };
                body.push(node);
                break;
            }
            case Token_1.TokenType.OPERATOR:
            case Token_1.TokenType.PRIMITIVE:
            case Token_1.TokenType.SYMBOL:
                body.push(expressionSyntaxParser_1.expressionSyntaxParser(iter.skip(-1), ctx).ast);
                break;
            case Token_1.TokenType.MARKER:
                switch (token.value) {
                    case ';': break;
                    case '}': return body;
                    default:
                        return token.throwDebug('unexpected');
                }
                break;
            case Token_1.TokenType.MARKER:
            case Token_1.TokenType.TYPE:
                return token.throwDebug('unexpected');
            default:
                other_1.exhaust(token.type);
        }
    }
    throw new Error('ran out of tokens lol');
}
exports.bodySyntaxParser = bodySyntaxParser;
//# sourceMappingURL=bodySyntaxParser.js.map