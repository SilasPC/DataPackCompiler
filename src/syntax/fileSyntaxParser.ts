
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
import { ResultWrapper, Result } from "../toolbox/Result";
import { ASTStaticBody } from "./AST";
import { Interspercer } from "../toolbox/Interspercer";

export function fileSyntaxParser(mod: ModuleFile, ctx: CompileContext): Result<ASTStaticBody,null> {

    const result = new ResultWrapper<ASTStaticBody,null>()

    const iter = mod.getTokenIterator()
    let isPub: TokenI | null = null

    let body: ASTStaticBody = new Interspercer()

    for (let token of iter) {

        if (token.type == TokenType.DIRECTIVE) {
            body.addSubData(token)
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
                        body.add(wrapPublic(parseUse(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'mod': {
                        let res = parseModule(iter,ctx)
                        if (result.merge(res)) return result.none()
                        body.add(wrapPublic(res.getValue(),isPub))
                        isPub = null
                        break
                    }
                    case 'fn': {
                        let res = parseFunction(iter,ctx)
                        if (result.merge(res)) return result.none()
                        body.add(wrapPublic(res.getValue(),isPub))
                        isPub = null
                        break
                    }
                    case 'const':
                    case 'let':
                        body.add(wrapPublic(parseDeclaration(iter),isPub))
                        isPub = null
                        break
                    case 'struct':
                        body.add(wrapPublic(parseStruct(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'event': {
                        let res = parseEvent(iter,ctx)
                        if (result.merge(res)) return result.none()
                        body.add(wrapPublic(res.getValue(),isPub))
                        isPub = null
                        break
                    }
                    case 'on': {
                        if (isPub) token.throwUnexpectedKeyWord()
                        let res = parseOnEvent(iter,ctx)
                        if (result.merge(res)) return result.none()
                        body.add(res.getValue())
                        break
                    }
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

    mod.ast.insertEnd(body)

    return result.wrap(body)

}
