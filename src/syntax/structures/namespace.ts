
import { ASTModuleNode, ASTNodeType, ASTStaticDeclaration } from "../AST"
import { TokenType, TokenI } from "../../lexing/Token"
import { bodySyntaxParser } from "../bodySyntaxParser"
import { getType, wrapExport } from "../helpers"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { ParsingFile } from "../../toolbox/ParsingFile"
import { parseFunction } from "./function"
import { parseDeclaration } from "./declaration"
import { keywords } from "../../lexing/values"

export function parseModule(iter:TokenIteratorI,ctx:CompileContext): ASTModuleNode {
    let keyword = iter.current()
    if (keyword.type != TokenType.KEYWORD) throw new Error('token typing error')
    let identifier = iter.next().expectType(TokenType.SYMBOL)
    iter.next().expectType(TokenType.MARKER).expectValue('{')
    let body = parser(iter,ctx)
    return {
        type: ASTNodeType.MODULE,
        body,
        keyword,
        identifier
    }
}

function parser(iter: TokenIteratorI, ctx: CompileContext) {
    let body: ASTStaticDeclaration[] = []
    for (let token of iter) {
        switch (token.type) {
            case TokenType.KEYWORD: {
                switch (token.value) {
                    case 'import':
                    case 'export':
                        return token.throwUnexpectedKeyWord()
                    case 'namespace':
                        body.push(parseModule(iter,ctx))
                        break
                    case 'fn':
                        body.push(parseFunction(iter,ctx))
                        break
                    case 'let':
                        body.push(parseDeclaration(iter,ctx))
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
