
import { ASTLetNode, ASTNodeType } from "../AST"
import { expressionSyntaxParser } from "../expressionSyntaxParser"
import { getType } from "../helpers"
import { TokenType, KeywordToken, GenericToken, DirectiveToken } from "../../lexing/Token"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { tokenToType } from "../../semantics/types/Types"

export function parseDeclaration(dirs:DirectiveToken[],iter:TokenIteratorI,ctx:CompileContext): ASTLetNode {
    // allow destructured assignment?   let a,b,c = 1,2,3
    // or like this?                    let [a,b,c] = [1,2,3]
    // allow multi assignment?          let a = 1, b = 2, c = 3
    let letToken = iter.current() as KeywordToken
    let symbol = iter.next().expectType(TokenType.SYMBOL) as GenericToken
    let type = getType(iter)
    iter.next().expectType(TokenType.OPERATOR).expectValue('=')
    let initial = expressionSyntaxParser(iter,ctx,true).ast
    return new ASTLetNode(iter.file,letToken.indexStart,initial.indexEnd,dirs,letToken.value=='const',symbol,type,initial)
}
