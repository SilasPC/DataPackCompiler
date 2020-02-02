
import { ParsingFile } from "../toolbox/ParsingFile";
import { TokenType, TokenI } from "../lexing/Token";
import { parseFunction } from "./structures/function";
import { wrapExport } from "./helpers";
import { parseDeclaration } from "./structures/declaration";
import { CompileContext } from "../toolbox/CompileContext";
import { parseModule } from "./structures/module";
import { parseImport } from "./structures/import";
import { parseStruct } from "./structures/struct";
import { parseEvent } from "./structures/event";

export function fileSyntaxParser(pfile: ParsingFile, ctx: CompileContext): void {
    const iter = pfile.getTokenIterator()
    let doExport: TokenI | null = null
    for (let token of iter) {
        switch (token.type) {
            case TokenType.KEYWORD: {
                switch (token.value) {
                    case 'import':
                        if (doExport) return token.throwUnexpectedKeyWord()
                        pfile.addASTNode(parseImport(iter,ctx))
                        doExport = null
                        break
                    case 'export':
                        if (doExport) return token.throwUnexpectedKeyWord()
                        doExport = token
                        break
                    case 'mod':
                        pfile.addASTNode(wrapExport(parseModule(iter,ctx),doExport))
                        doExport = null
                        break
                    case 'fn':
                        pfile.addASTNode(wrapExport(parseFunction(iter,ctx),doExport))
                        doExport = null
                        break
                    case 'const':
                    case 'let':
                        pfile.addASTNode(wrapExport(parseDeclaration(iter,ctx),doExport))
                        doExport = null
                        break
                    case 'struct':
                        pfile.addASTNode(wrapExport(parseStruct(iter,ctx),doExport))
                        break
                    case 'event':
                        pfile.addASTNode(wrapExport(parseEvent(iter,ctx),doExport))
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
