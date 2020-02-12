
import { ASTFnNode, ASTNodeType } from "../AST"
import { TokenType, TokenI, KeywordToken, GenericToken } from "../../lexing/Token"
import { bodySyntaxParser } from "../bodySyntaxParser"
import { getType } from "../helpers"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseFunction(iter:TokenIteratorI,ctx:CompileContext): ASTFnNode {
    let fnToken = iter.current() as KeywordToken
    let fnSymbol = iter.next().expectType(TokenType.SYMBOL) as GenericToken
    let parameters: {symbol:TokenI,type:TokenI,ref:boolean}[] = []
    iter.next().expectType(TokenType.MARKER).expectValue('(')
    while (iter.peek().type == TokenType.SYMBOL || iter.peek().type == TokenType.KEYWORD) {
        let ref = false
        let t1 = iter.next()
        if (t1.type == TokenType.KEYWORD) {
            if (t1.value != 'ref') return t1.throwUnexpectedKeyWord()
            ref = true
            iter.peek().expectType(TokenType.SYMBOL)
        } else iter.skip(-1)
        let symbol = iter.next().expectType(TokenType.SYMBOL)
        let type = getType(iter)
        if (!type) throw new Error('infer arg')
        parameters.push({symbol,type,ref})
        let comma = iter.peek()
        if (comma.type != TokenType.MARKER || comma.value != ',') break
        iter.skip(1).peek().expectType(TokenType.SYMBOL)
    }
    iter.next().expectType(TokenType.MARKER).expectValue(')')
    let returnType = getType(iter)
    iter.next().expectType(TokenType.MARKER).expectValue('{')
    let body = bodySyntaxParser(iter,ctx)
    return new ASTFnNode(iter.file,fnToken.indexStart,iter.current().indexEnd,fnSymbol,parameters,returnType,body)
}