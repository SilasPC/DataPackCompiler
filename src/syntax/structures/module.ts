
import { ASTModuleNode, ASTNodeType, ASTStaticDeclaration, ASTStaticBody } from "../AST"
import { TokenType, TokenI, DirectiveToken } from "../../lexing/Token"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { parseFunction } from "./function"
import { parseDeclaration } from "./declaration"
import { parseEvent } from "./event"
import { parseStruct } from "./struct"
import { wrapPublic } from "../helpers"
import { Interspercer } from "../../toolbox/Interspercer"
import { parseOnEvent } from "./onEvent"
import { ResultWrapper, Result } from "../../toolbox/Result"

export function parseModule(iter:TokenIteratorI,ctx:CompileContext): Result<ASTModuleNode,null> {
    const result = new ResultWrapper<ASTModuleNode,null>()
    let keyword = iter.current()
    if (keyword.type != TokenType.KEYWORD) throw new Error('token typing error')
    let identifier = iter.next().expectType(TokenType.SYMBOL)
    iter.next().expectType(TokenType.MARKER).expectValue('{')
    let body = parser(iter,ctx)
    if (result.merge(body)) return result.none()
    return result.wrap(new ASTModuleNode(iter.file,keyword.indexStart,iter.current().indexEnd,identifier,body.getValue()))
}

function parser(iter: TokenIteratorI, ctx: CompileContext): Result<ASTStaticBody,null> {
    
    const result = new ResultWrapper<ASTStaticBody,null>()

    let body: ASTStaticBody = new Interspercer()
    let isPub: TokenI | null = null
    
    for (let token of iter) {

        if (token.type == TokenType.DIRECTIVE) {
            body.addSubData(token)
            continue
        }

        switch (token.type) {
            case TokenType.KEYWORD: {
                switch (token.value) {
                    case 'on': {
                        if (isPub) token.throwUnexpectedKeyWord()
                        let res = parseOnEvent(iter,ctx)
                        if (result.merge(res)) return result.none()
                        body.add(res.getValue())
                        break
                    }
                    case 'pub':
                        if (isPub) token.throwUnexpectedKeyWord()
                        isPub = token
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
                    case 'event': {
                        let res = parseEvent(iter,ctx)
                        if (result.merge(res)) return result.none()
                        body.add(wrapPublic(res.getValue(),isPub))
                        isPub = null
                        break
                    }
                    case 'let': {
                        let res = parseDeclaration(iter)
                        //if (result.merge(res)) return result.none()
                        body.add(wrapPublic(res,isPub))
                        isPub = null
                        break
                    }
                    case 'struct':
                        body.add(wrapPublic(parseStruct(iter,ctx),isPub))
                        isPub = null
                        break
                    default:
                        return token.throwUnexpectedKeyWord()
                }
                break
            }
            case TokenType.MARKER:
                if (token.value == '}') return result.wrap(body)
            default:
                return token.throwDebug('only expected keywords in root scope')
        }
    }

    throw new Error('ran out of tokens')

}
