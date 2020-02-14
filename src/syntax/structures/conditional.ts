
import { ASTIfNode, ASTNodeType, ASTNode, ASTStatement } from "../AST"
import { TokenType, TokenI, KeywordToken, DirectiveToken } from "../../lexing/Token"
import { exprParseNoList } from "../expressionSyntaxParser"
import { bodyOrLineSyntaxParser } from "../bodySyntaxParser"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseConditional(dirs:DirectiveToken[],iter:TokenIteratorI,ctx:CompileContext): ASTIfNode {

    let ifToken = iter.current() as KeywordToken
    iter.next().expectType(TokenType.MARKER).expectValue('(')
    let expression = exprParseNoList(iter,true).ast
    iter.skip(-1).next().expectType(TokenType.MARKER).expectValue(')')
    let primaryBranch = bodyOrLineSyntaxParser(iter,ctx)
    let secondaryBranch: ASTStatement[] = []
    let elseToken: KeywordToken | null = null
    if (iter.peek().type == TokenType.KEYWORD && iter.peek().value == 'else') {
        elseToken = iter.next() as KeywordToken
        secondaryBranch = bodyOrLineSyntaxParser(iter,ctx)
    }

    let last = secondaryBranch[secondaryBranch.length-1] || primaryBranch[primaryBranch.length-1]

    return new ASTIfNode(iter.file,ifToken.indexStart,last.indexEnd,dirs,expression,primaryBranch,secondaryBranch)

}
