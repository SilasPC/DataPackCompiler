
import { ASTIfNode, ASTNodeType, ASTNode, ASTStatement, ASTBody } from "../AST"
import { TokenType, TokenI, KeywordToken, DirectiveToken } from "../../lexing/Token"
import { exprParseNoList } from "../expressionSyntaxParser"
import { bodyOrLineSyntaxParser } from "../bodySyntaxParser"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { Interspercer } from "../../toolbox/Interspercer"

export function parseConditional(iter:TokenIteratorI,ctx:CompileContext): ASTIfNode {

    let ifToken = iter.current() as KeywordToken
    iter.next().expectType(TokenType.MARKER).expectValue('(')
    let expression = exprParseNoList(iter,true).ast
    iter.skip(-1).next().expectType(TokenType.MARKER).expectValue(')')
    let primaryBranch = bodyOrLineSyntaxParser(iter,ctx)
    let secondaryBranch: ASTBody
    let elseToken: KeywordToken | null = null
    if (iter.peek().type == TokenType.KEYWORD && iter.peek().value == 'else') {
        elseToken = iter.next() as KeywordToken
        secondaryBranch = bodyOrLineSyntaxParser(iter,ctx)
    } else secondaryBranch = new Interspercer()

    return new ASTIfNode(iter.file,ifToken.indexStart,iter.current().indexEnd,expression,primaryBranch,secondaryBranch)

}
