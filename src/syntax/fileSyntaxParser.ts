
import { ParsingFile } from "../lexing/ParsingFile";
import { TokenType, TokenI } from "../lexing/Token";
import { parseFunction } from "./structures/function";
import { wrapExport } from "./helpers";
import { parseDeclaration } from "./structures/declaration";
import { CompileContext } from "../toolbox/CompileContext";

export function fileSyntaxParser(pfile: ParsingFile, ctx: CompileContext): void {
    const iter = pfile.getTokenIterator()
    let doExport: TokenI | null = null
    for (let token of iter) {
        switch (token.type) {
            case TokenType.KEYWORD: {
                switch (token.value) {
                    case 'import':
                        if (doExport) return token.throwUnexpectedKeyWord()
                        return token.throwDebug('no import yet')
                    case 'export':
                        if (doExport) return token.throwUnexpectedKeyWord()
                        doExport = token
                        break
                    case 'fn':
                        pfile.addASTNode(wrapExport(parseFunction(iter,ctx),doExport))
                        doExport = null
                        break
                    case 'let':
                        pfile.addASTNode(wrapExport(parseDeclaration(iter,ctx),doExport))
                        doExport = null
                        break
                    default:
                        return token.throwUnexpectedKeyWord()
                }
                break
            }
            default:
                return token.throwDebug('only expected keywords in root scope')
        }
    }

    if (doExport) pfile.throwUnexpectedEOF();

}
