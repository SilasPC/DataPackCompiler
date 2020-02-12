
import { ParsingFile } from "../toolbox/ParsingFile";
import { TokenType, TokenI } from "../lexing/Token";
import { parseFunction } from "./structures/function";
import { wrapPublic } from "./helpers";
import { parseDeclaration } from "./structures/declaration";
import { CompileContext } from "../toolbox/CompileContext";
import { parseModule } from "./structures/module";
import { parseUse } from "./structures/use";
import { parseStruct } from "./structures/struct";
import { parseEvent } from "./structures/event";
import { parseOnEvent } from "./structures/onEvent";

export function fileSyntaxParser(pfile: ParsingFile, ctx: CompileContext): void {
    const iter = pfile.getTokenIterator()
    let isPub: TokenI | null = null
    for (let token of iter) {
        switch (token.type) {
            case TokenType.KEYWORD: {
                switch (token.value) {
                    case 'use':
                        pfile.addASTNode(wrapPublic(parseUse(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'mod':
                        pfile.addASTNode(wrapPublic(parseModule(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'fn':
                        pfile.addASTNode(wrapPublic(parseFunction(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'const':
                    case 'let':
                        pfile.addASTNode(wrapPublic(parseDeclaration(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'struct':
                        pfile.addASTNode(wrapPublic(parseStruct(iter,ctx),isPub))
                        break
                    case 'event':
                        pfile.addASTNode(wrapPublic(parseEvent(iter,ctx),isPub))
                        break
                    case 'on':
                        pfile.addASTNode(wrapPublic(parseOnEvent(iter,ctx),isPub))
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

    if (isPub) pfile.throwUnexpectedEOF();

}
