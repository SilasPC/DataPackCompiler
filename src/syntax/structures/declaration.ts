
import { ASTLetNode, ASTNodeType } from "../AST"
import { expressionSyntaxParser } from "../expressionSyntaxParser"
import { getType } from "../helpers"
import { TokenType } from "../../lexing/Token"
import { TokenIterator } from "../../lexing/TokenIterator"

export function parseDeclaration(iter:TokenIterator): ASTLetNode {
    let symbol = iter.next().expectType(TokenType.SYMBOL)
    let type = getType(iter)
    iter.next().expectType(TokenType.OPERATOR).expectValue('=')
    let initial = expressionSyntaxParser(iter) //expressionSyntaxParser(iter)
    iter.next().expectSemiColon()
    return {
        type: ASTNodeType.DEFINE,
        identifier: symbol,
        varType: type,
        initial
    }
}