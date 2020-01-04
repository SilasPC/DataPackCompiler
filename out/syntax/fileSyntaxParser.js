"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
const function_1 = require("./structures/function");
const helpers_1 = require("./helpers");
const declaration_1 = require("./structures/declaration");
function fileSyntaxParser(pfile, ctx) {
    const iter = pfile.getTokenIterator();
    let doExport = null;
    for (let token of iter) {
        switch (token.type) {
            case Token_1.TokenType.KEYWORD: {
                switch (token.value) {
                    case 'import':
                        if (doExport)
                            return token.throwUnexpectedKeyWord();
                        return token.throwDebug('no import yet');
                    case 'export':
                        if (doExport)
                            return token.throwUnexpectedKeyWord();
                        doExport = token;
                        break;
                    case 'fn':
                        pfile.addASTNode(helpers_1.wrapExport(function_1.parseFunction(iter, ctx), doExport));
                        doExport = null;
                        break;
                    case 'let':
                        pfile.addASTNode(helpers_1.wrapExport(declaration_1.parseDeclaration(iter, ctx), doExport));
                        doExport = null;
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