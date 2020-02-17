
import { ASTIfNode, ASTBody } from "../AST"
import { TokenType, KeywordToken, } from "../../lexing/Token"
import { exprParseNoList } from "../expressionSyntaxParser"
import { bodyOrLineSyntaxParser } from "../bodySyntaxParser"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { Interspercer } from "../../toolbox/Interspercer"
import { Result, ResultWrapper } from "../../toolbox/Result"

export function parseConditional(iter:TokenIteratorI,ctx:CompileContext): Result<ASTIfNode,null> {

    const result = new ResultWrapper<ASTIfNode,null>()

    let ifToken = iter.current() as KeywordToken
    iter.next().expectType(TokenType.MARKER).expectValue('(')
    let expression = exprParseNoList(iter,true).ast
    iter.skip(-1).next().expectType(TokenType.MARKER).expectValue(')')
    let primaryBranch = bodyOrLineSyntaxParser(iter,ctx)
    if (result.merge(primaryBranch)) return result.none()
    let secondaryBranch: ASTBody
    let elseToken: KeywordToken | null = null
    if (iter.peek().type == TokenType.KEYWORD && iter.peek().value == 'else') {
        elseToken = iter.next() as KeywordToken
        let res = bodyOrLineSyntaxParser(iter,ctx)
        if (result.merge(res)) return result.none()
        secondaryBranch = res.getValue()
    } else secondaryBranch = new Interspercer()

    return result.wrap(new ASTIfNode(iter.file,ifToken.indexStart,iter.current().indexEnd,expression,primaryBranch.getValue(),secondaryBranch))

}
