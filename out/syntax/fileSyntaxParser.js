"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
const function_1 = require("./structures/function");
const helpers_1 = require("./helpers");
const SyntaxParser_1 = require("./SyntaxParser");
const declaration_1 = require("./structures/declaration");
const parser = new SyntaxParser_1.SyntaxParser('file');
function fileSyntaxParser(pfile, ctx) {
    const iter = pfile.getTokenIterator();
    let doExport = false;
    for (let token of iter) {
        switch (token.type) {
            case Token_1.TokenType.KEYWORD: {
                switch (token.value) {
                    case 'export':
                        if (doExport)
                            return token.throwUnexpectedKeyWord();
                        doExport = true;
                        break;
                    case 'fn':
                        pfile.addASTNode(helpers_1.wrapExport(function_1.parseFunction(iter, ctx), doExport));
                        break;
                    case 'let':
                        pfile.addASTNode(helpers_1.wrapExport(declaration_1.parseDeclaration(iter, ctx), doExport));
                        break;
                    default:
                        return token.throwUnexpectedKeyWord();
                }
                break;
            }
            default:
                return token.throwDebug('only expected keywords in root scope');
        }
    }
    if (doExport)
        pfile.throwUnexpectedEOF();
}
exports.fileSyntaxParser = fileSyntaxParser;
//# sourceMappingURL=fileSyntaxParser.js.map