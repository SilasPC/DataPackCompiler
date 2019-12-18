
import { ParsingFile } from "../lexing/ParsingFile";
import { TokenType, Token } from "../lexing/Token";
import { parseFunction } from "./structures/function";
import { wrapExport } from "./helpers";
import { SyntaxParser } from "./SyntaxParser";
import { parseDeclaration } from "./structures/declaration";
import { CompileContext } from "../toolbox/CompileContext";

const parser: SyntaxParser<ParsingFile> = new SyntaxParser('file')

export function fileSyntaxParser(pfile: ParsingFile, ctx: CompileContext): void {
    const iter = pfile.getTokenIterator()
    let doExport = false
    for (let token of iter) {
        switch (token.type) {
            case TokenType.KEYWORD: {
                switch (token.value) {
                    case 'export':
                        if (doExport) return token.throwUnexpectedKeyWord()
                        doExport = true
                        break
                    case 'fn':
                        pfile.addASTNode(wrapExport(parseFunction(iter,ctx),doExport))
                        break
                    case 'let':
                        pfile.addASTNode(wrapExport(parseDeclaration(iter,ctx),doExport))
                        break
                    default:
                        return token.throwUnexpectedKeyWord()
                }
            }
            default:
                return token.throwDebug('only expected keywords in root scope')
        }
    }

    if (doExport) pfile.throwUnexpectedEOF();

}
