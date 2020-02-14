
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

export function parseModule(iter:TokenIteratorI,ctx:CompileContext): ASTModuleNode {
    let keyword = iter.current()
    if (keyword.type != TokenType.KEYWORD) throw new Error('token typing error')
    let identifier = iter.next().expectType(TokenType.SYMBOL)
    iter.next().expectType(TokenType.MARKER).expectValue('{')
    let body = parser(iter,ctx)
    return new ASTModuleNode(iter.file,keyword.indexStart,iter.current().indexEnd,identifier,body)
}

function parser(iter: TokenIteratorI, ctx: CompileContext) {

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
                    case 'pub':
                        if (isPub) token.throwUnexpectedKeyWord()
                        isPub = token
                        break
                    case 'mod':
                        body.add(wrapPublic(parseModule(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'fn':
                        body.add(wrapPublic(parseFunction(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'event':
                        body.add(wrapPublic(parseEvent(iter,ctx),isPub))
                        isPub = null
                        break
                    case 'let':
                        body.add(wrapPublic(parseDeclaration(iter,ctx),isPub))
                        isPub = null
                        break
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
                if (token.value == '}') return body
            default:
                return token.throwDebug('only expected keywords in root scope')
        }
    }

    throw new Error('ran out of tokens')

}
