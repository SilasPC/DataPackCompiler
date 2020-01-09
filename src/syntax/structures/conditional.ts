
import { ASTIfNode, ASTNodeType, ASTNode, ASTStatement } from "../AST"
import { TokenType, TokenI } from "../../lexing/Token"
import { expressionSyntaxParser } from "../expressionSyntaxParser"
import { bodyOrLineSyntaxParser } from "../bodySyntaxParser"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseConditional(iter:TokenIteratorI,ctx:CompileContext): ASTIfNode {

    let ifToken = iter.current()
    iter.next().expectType(TokenType.MARKER).expectValue('(')
    let expression = expressionSyntaxParser(iter,ctx,true).ast
    iter.next().expectType(TokenType.MARKER).expectValue(')')
    let primaryBranch = bodyOrLineSyntaxParser(iter,ctx)
    let secondaryBranch: ASTStatement[] = []
    let elseToken: TokenI | null = null
    if (iter.peek().type == TokenType.KEYWORD && iter.peek().value == 'else') {
        elseToken = iter.next()
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
