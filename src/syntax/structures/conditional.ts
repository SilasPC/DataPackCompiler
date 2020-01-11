
import { ASTIfNode, ASTNodeType, ASTNode, ASTStatement } from "../AST"
import { TokenType, TokenI, KeywordToken } from "../../lexing/Token"
import { expressionSyntaxParser } from "../expressionSyntaxParser"
import { bodyOrLineSyntaxParser } from "../bodySyntaxParser"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseConditional(iter:TokenIteratorI,ctx:CompileContext): ASTIfNode {

    let ifToken = iter.current() as KeywordToken
    iter.next().expectType(TokenType.MARKER).expectValue('(')
    let expression = expressionSyntaxParser(iter,ctx,true).ast
    iter.next().expectType(TokenType.MARKER).expectValue(')')
    let primaryBranch = bodyOrLineSyntaxParser(iter,ctx)
    let secondaryBranch: ASTStatement[] = []
    let elseToken: KeywordToken | null = null
    if (iter.peek().type == TokenType.KEYWORD && iter.peek().value == 'else') {
        elseToken = iter.next() as KeywordToken
        secondaryBranch = bodyOrLineSyntaxParser(iter,ctx)
    }

    return {
        type: ASTNodeType.CONDITIONAL,
        expression,
        primaryBranch,
        secondaryBranch,
        keyword: ifToken,
        keywordElse: elseToken
    }

}
