
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

    for (let token of iter) {

        if (token.type == TokenType.DIRECTIVE) {
            pfile.ast.addSubData(token)
            continue
        }

        switch (token.type) {
            case TokenType.KEYWORD: {
                switch (token.value) {
                    case 'pub':
                        if (isPub) token.throwUnexpectedKeyWord()
                        isPub = token
                        break
                    case 'use':
                        pfile.ast.add(wrapPublic(parseUse(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'mod':
                        pfile.ast.add(wrapPublic(parseModule(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'fn':
                        pfile.ast.add(wrapPublic(parseFunction(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'const':
                    case 'let':
                        pfile.ast.add(wrapPublic(parseDeclaration(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'struct':
                        pfile.ast.add(wrapPublic(parseStruct(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'event':
                        pfile.ast.add(wrapPublic(parseEvent(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'on':
                        if (isPub) token.throwUnexpectedKeyWord()
                        pfile.ast.add(parseOnEvent(iter,ctx))
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
