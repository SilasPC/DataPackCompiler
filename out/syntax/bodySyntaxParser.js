"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
const AST_1 = require("./AST");
const expressionSyntaxParser_1 = require("./expressionSyntaxParser");
const conditional_1 = require("./structures/conditional");
const declaration_1 = require("./structures/declaration");
const SyntaxParser_1 = require("./SyntaxParser");
function bodySyntaxParser(iter) {
    let body = [];
    parser.consume(iter, body);
    return body;
}
exports.bodySyntaxParser = bodySyntaxParser;
const parser = new SyntaxParser_1.SyntaxParser('body');
parser
    .usingType(Token_1.TokenType.KEYWORD)
    .case('let', (iter, body) => {
    body.push(declaration_1.parseDeclaration(iter));
})
    .case('if', (iter, body) => {
    body.push(conditional_1.parseConditional(iter));
});
parser
    .usingType(Token_1.TokenType.COMMAND)
    .fallback((iter, body) => {
    let node = {
        type: AST_1.ASTNodeType.COMMAND,
        cmd: iter.current().value
    };
    body.push(node);
});
parser
    .usingType(Token_1.TokenType.SYMBOL)
    .fallback((iter, body) => {
    iter.skip(-1);
    body.push(expressionSyntaxParser_1.expressionSyntaxParser(iter).ast);
});
parser
    .usingType(Token_1.TokenType.MARKER)
    .case('}', () => true)
    .case(';', () => { });
parser
    .fallback((iter, body) => {
    body.push(expressionSyntaxParser_1.expressionSyntaxParser(iter.skip(-1)).ast);
});
//# sourceMappingURL=bodySyntaxParser.js.map