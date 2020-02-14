
import { ParsingFile } from "../toolbox/ParsingFile";
import { TokenType, TokenI, DirectiveToken } from "../lexing/Token";
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
    let dirs: DirectiveToken[] = []
    let clearDirs = false
    for (let token of iter) {

        if (clearDirs) {
            dirs = []
            clearDirs = false
        }
        if (token.type == TokenType.DIRECTIVE) {
            dirs.push(token)
            continue
        } else clearDirs = true

        switch (token.type) {
            case TokenType.KEYWORD: {
                switch (token.value) {
                    case 'pub':
                        if (isPub) token.throwUnexpectedKeyWord()
                        isPub = token
                        break
                    case 'use':
                        pfile.addASTNode(wrapPublic(parseUse(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'mod':
                        pfile.addASTNode(wrapPublic(parseModule(dirs,iter,ctx),isPub))
                        isPub = null
                        break
                    case 'fn':
                        pfile.addASTNode(wrapPublic(parseFunction(dirs,iter,ctx),isPub))
                        isPub = null
                        break
                    case 'const':
                    case 'let':
                        pfile.addASTNode(wrapPublic(parseDeclaration(dirs,iter,ctx),isPub))
                        isPub = null
                        break
                    case 'struct':
                        pfile.addASTNode(wrapPublic(parseStruct(dirs,iter,ctx),isPub))
                        break
                    case 'event':
                        pfile.addASTNode(wrapPublic(parseEvent(dirs,iter,ctx),isPub))
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

    if (!clearDirs && dirs.length) {
        throw new Error('trailing directives in file')
    }

    if (isPub) pfile.throwUnexpectedEOF();

}
