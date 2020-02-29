
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
    let secondaryBranch: ASTBody
    if (iter.peek().value == 'else') {
        iter.skip(1)
        let res = bodyOrLineSyntaxParser(iter,ctx)
        if (result.merge(res)) return result.none()
        secondaryBranch = res.getValue()
    } else secondaryBranch = new Interspercer()

    if (result.merge(primaryBranch)) return result.none()
    
    return result.wrap(new ASTIfNode(iter.file,ifToken.indexStart,iter.current().indexEnd,expression,primaryBranch.getValue(),secondaryBranch))

}
