
import { ASTIfNode, ASTNodeType, ASTNode } from "../AST"
import { TokenType } from "../../lexing/Token"
import { expressionSyntaxParser } from "../expressionSyntaxParser"
import { bodySyntaxParser } from "../bodySyntaxParser"
import { TokenIterator } from "../../lexing/TokenIterator"

export function parseConditional(iter:TokenIterator): ASTIfNode {

    iter.next().expectType(TokenType.MARKER).expectValue('(')
    let expression = expressionSyntaxParser(iter).ast
    iter.next().expectType(TokenType.MARKER).expectValue(')')
    iter.next().expectType(TokenType.MARKER).expectValue('{') // or expression here
    let primaryBranch = bodySyntaxParser(iter)
    let secondaryBranch: ASTNode[] = []
    if (iter.peek().type == TokenType.KEYWORD && iter.peek().value == 'else') {
        iter.skip(1)
        iter.next().expectType(TokenType.MARKER).expectValue('{') // or expression here
        secondaryBranch = bodySyntaxParser(iter)
    }

    return {
        type: ASTNodeType.CONDITIONAL,
        expression,
        primaryBranch,
        secondaryBranch
    }

}
