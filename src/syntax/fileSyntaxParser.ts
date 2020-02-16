
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
import { ModuleFile } from "../input/InputTree";

export function fileSyntaxParser(mod: ModuleFile, ctx: CompileContext): void {
    const iter = mod.getTokenIterator()
    let isPub: TokenI | null = null

    for (let token of iter) {

        if (token.type == TokenType.DIRECTIVE) {
            mod.ast.addSubData(token)
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
                        mod.ast.add(wrapPublic(parseUse(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'mod':
                        mod.ast.add(wrapPublic(parseModule(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'fn':
                        mod.ast.add(wrapPublic(parseFunction(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'const':
                    case 'let':
                        mod.ast.add(wrapPublic(parseDeclaration(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'struct':
                        mod.ast.add(wrapPublic(parseStruct(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'event':
                        mod.ast.add(wrapPublic(parseEvent(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'on':
                        if (isPub) token.throwUnexpectedKeyWord()
                        mod.ast.add(parseOnEvent(iter,ctx))
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

    if (isPub) mod.throwUnexpectedEOF();

}
