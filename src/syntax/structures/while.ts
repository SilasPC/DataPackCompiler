
import { ASTIfNode, ASTNodeType, ASTNode, ASTStatement, ASTWhileNode } from "../AST"
import { TokenType, TokenI, KeywordToken, DirectiveToken } from "../../lexing/Token"
import { exprParseNoList } from "../expressionSyntaxParser"
import { bodyOrLineSyntaxParser } from "../bodySyntaxParser"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseWhile(iter:TokenIteratorI,ctx:CompileContext): ASTWhileNode {

    let whileToken = iter.current() as KeywordToken
    iter.next().expectType(TokenType.MARKER).expectValue('(')
    let expression = exprParseNoList(iter,true).ast
    iter.skip(-1).next().expectType(TokenType.MARKER).expectValue(')')
    let body = bodyOrLineSyntaxParser(iter,ctx)

    return new ASTWhileNode(iter.file,whileToken.indexStart,iter.current().indexEnd,expression,body)

}
