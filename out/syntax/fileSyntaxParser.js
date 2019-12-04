"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
const function_1 = require("./structures/function");
const helpers_1 = require("./helpers");
const SyntaxParser_1 = require("./SyntaxParser");
const declaration_1 = require("./structures/declaration");
const parser = new SyntaxParser_1.SyntaxParser('file');
parser
    .usingType(Token_1.TokenType.KEYWORD)
    .case('fn', (iter, pfile) => {
    pfile.addASTNode(helpers_1.wrapExport(function_1.parseFunction(iter), false)); // do export thing
})
    .case('let', (iter, pfile) => {
    pfile.addASTNode(helpers_1.wrapExport(declaration_1.parseDeclaration(iter), false));
});
function fileSyntaxParser(pfile) {
    parser.consume(pfile.getTokenIterator(), pfile);
    //if (shouldExport) pfile.throwUnexpectedEOF();
}
exports.fileSyntaxParser = fileSyntaxParser;
//# sourceMappingURL=fileSyntaxParser.js.map