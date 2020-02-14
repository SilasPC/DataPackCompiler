
import { ASTModuleNode, ASTNodeType, ASTStaticDeclaration } from "../AST"
import { TokenType, TokenI, DirectiveToken } from "../../lexing/Token"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { parseFunction } from "./function"
import { parseDeclaration } from "./declaration"
import { parseEvent } from "./event"
import { parseStruct } from "./struct"
import { wrapPublic } from "../helpers"

export function parseModule(dirs:DirectiveToken[],iter:TokenIteratorI,ctx:CompileContext): ASTModuleNode {
    let keyword = iter.current()
    if (keyword.type != TokenType.KEYWORD) throw new Error('token typing error')
    let identifier = iter.next().expectType(TokenType.SYMBOL)
    iter.next().expectType(TokenType.MARKER).expectValue('{')
    let body = parser(iter,ctx)
    return new ASTModuleNode(iter.file,keyword.indexStart,body[body.length-1].indexEnd,dirs,identifier,body)
}

function parser(iter: TokenIteratorI, ctx: CompileContext) {
    let body: ASTStaticDeclaration[] = []
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
                        return token.throwUnexpectedKeyWord()
                    case 'mod':
                        body.push(wrapPublic(parseModule(dirs,iter,ctx),isPub))
                        break
                    case 'fn':
                        body.push(wrapPublic(parseFunction(dirs,iter,ctx),isPub))
                        break
                    case 'event':
                        body.push(wrapPublic(parseEvent(dirs,iter,ctx),isPub))
                        break
                    case 'let':
                        body.push(wrapPublic(parseDeclaration(dirs,iter,ctx),isPub))
                        break
                    case 'struct':
                        body.push(wrapPublic(parseStruct(dirs,iter,ctx),isPub))
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
