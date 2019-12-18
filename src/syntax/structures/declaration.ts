
import { ASTLetNode, ASTNodeType } from "../AST"
import { expressionSyntaxParser } from "../expressionSyntaxParser"
import { getType } from "../helpers"
import { TokenType } from "../../lexing/Token"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseDeclaration(iter:TokenIteratorI,ctx:CompileContext): ASTLetNode {
    // allow destructured assignment?   let a,b,c = 1,2,3
    // or like this?                    let [a,b,c] = [1,2,3]
    // allow multi assignment?          let a = 1, b = 2, c = 3
    let symbol = iter.next().expectType(TokenType.SYMBOL)
    let type = getType(iter)
    iter.next().expectType(TokenType.OPERATOR).expectValue('=')
    let initial = expressionSyntaxParser(iter,ctx).ast
    // iter.next().expectSemiColon() // needed?
    return {
        type: ASTNodeType.DEFINE,
        identifier: symbol,
        varType: type,
        initial
    }
}
