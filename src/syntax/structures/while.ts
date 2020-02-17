
import { ASTIfNode, ASTNodeType, ASTNode, ASTStatement, ASTWhileNode } from "../AST"
import { TokenType, TokenI, KeywordToken, DirectiveToken } from "../../lexing/Token"
import { exprParseNoList } from "../expressionSyntaxParser"
import { bodyOrLineSyntaxParser } from "../bodySyntaxParser"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { ResultWrapper, Result } from "../../toolbox/Result"

export function parseWhile(iter:TokenIteratorI,ctx:CompileContext): Result<ASTWhileNode,null> {

    const result = new ResultWrapper<ASTWhileNode,null>()

    let whileToken = iter.current() as KeywordToken
    iter.next().expectType(TokenType.MARKER).expectValue('(')
    let expression = exprParseNoList(iter,true).ast
    iter.skip(-1).next().expectType(TokenType.MARKER).expectValue(')')
    let bodyRes = bodyOrLineSyntaxParser(iter,ctx)

    if (result.merge(bodyRes)) return result.none()

    return result.wrap(new ASTWhileNode(iter.file,whileToken.indexStart,iter.current().indexEnd,expression,bodyRes.getValue()))

}
