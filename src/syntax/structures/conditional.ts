
import { ASTIfNode, ASTNodeType, ASTNode } from "../AST"
import { TokenType } from "../../lexing/Token"
import { expressionSyntaxParser } from "../expressionSyntaxParser"
import { bodyOrLineSyntaxParser } from "../bodySyntaxParser"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseConditional(iter:TokenIteratorI,ctx:CompileContext): ASTIfNode {

    iter.next().expectType(TokenType.MARKER).expectValue('(')
    let expression = expressionSyntaxParser(iter,ctx).ast
    iter.next().expectType(TokenType.MARKER).expectValue(')')
    let primaryBranch = bodyOrLineSyntaxParser(iter,ctx)
    let secondaryBranch: ASTNode[] = []
    if (iter.peek().type == TokenType.KEYWORD && iter.peek().value == 'else') {
        iter.skip(1)
        secondaryBranch = bodyOrLineSyntaxParser(iter,ctx)
    }

    return {
        type: ASTNodeType.CONDITIONAL,
        expression,
        primaryBranch,
        secondaryBranch
    }

}
