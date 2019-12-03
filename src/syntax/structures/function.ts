
import { ASTFnNode, ASTNodeType } from "../AST"
import { TokenType, Token } from "../../lexing/Token"
import { bodySyntaxParser } from "../bodySyntaxParser"
import { getType } from "../helpers"
import { TokenIterator } from "../../lexing/TokenIterator"

export function parseFunction(iter:TokenIterator): ASTFnNode {
    let fnSymbol = iter.next().expectType(TokenType.SYMBOL)
    let parameters: {symbol:Token,type:Token}[] = []
    iter.next().expectType(TokenType.MARKER).expectValue('(')
    while (iter.peek().type == TokenType.SYMBOL) {
        let symbol = iter.next()
        let type = getType(iter)
        parameters.push({symbol,type})
        let comma = iter.peek()
        if (comma.type != TokenType.MARKER || comma.value != ',') break
        iter.skip(1).peek().expectType(TokenType.SYMBOL)
    }
    iter.next().expectType(TokenType.MARKER).expectValue(')')
    let returnType = getType(iter)
    iter.next().expectType(TokenType.MARKER).expectValue('{')
    let body = bodySyntaxParser(iter)
    return {
        type: ASTNodeType.FUNCTION,
        identifier: fnSymbol,
        parameters,
        body,
        returnType
    }
}