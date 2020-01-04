
import { TokenType, Token } from "../lexing/Token";
import { ASTNode, ASTNodeType, ASTReturnNode } from "./AST";
import { expressionSyntaxParser } from "./expressionSyntaxParser";
import { parseConditional } from "./structures/conditional";
import { parseDeclaration } from "./structures/declaration";
import { TokenIteratorI, TokenIterator } from "../lexing/TokenIterator";
import { exhaust } from "../toolbox/other";
import { CompileContext } from "../toolbox/CompileContext";

export function bodyOrLineSyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTNode[] {
    if (iter.next().type == TokenType.MARKER && iter.current().value == '{')
        return bodySyntaxParser(iter,ctx)
    else
        return [lineSyntaxParser(iter,ctx)]
}

export function bodySyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTNode[] {
    let body: ASTNode[] = []
    loop:
    for (let token of iter) {
        if (token.type == TokenType.MARKER && token.value == '}') return body
        body.push(lineSyntaxParser(iter,ctx))
    }
    throw new Error('body ran out, end of file')
}

export function lineSyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTNode {
    const token = iter.current()
    switch (token.type) {
        case TokenType.KEYWORD: {
            switch (token.value) {
                case 'let': return parseDeclaration(iter,ctx)
                case 'if':  return parseConditional(iter,ctx)
                case 'return': {
                    // Later on, the expression parser must return a void type instead
                    // This should happen, as it should be able to parse everything
                    // using the shunting-yard algorithm
                    // That is a bit ambitious, but it sounds quite neat :D
                    // That also makes all this redundant anyways
                    if (iter.peek().type == TokenType.MARKER && iter.peek().value == ';')
                        return {
                            type: ASTNodeType.RETURN,
                            keyword: token,
                            node: null
                        }
                    else return {
                        type: ASTNodeType.RETURN,
                        keyword: token,
                        node: expressionSyntaxParser(iter,ctx).ast
                    }
                }
                default:
                    // ehm. I don't think I've implemented keywords in the expr parser
                    // lol
                    throw new Error('keywords cannot be passed to expr parser yet')
                    return expressionSyntaxParser(iter.skip(-1),ctx).ast
            }
            // return exhaust(token.value)
        }
        case TokenType.COMMAND:
            return ctx.syntaxSheet.readSyntax(iter.current(),ctx)
        case TokenType.OPERATOR:
        case TokenType.PRIMITIVE:
        case TokenType.SYMBOL:
            return expressionSyntaxParser(iter.skip(-1),ctx).ast
        case TokenType.MARKER:
            switch (token.value) {
                case ';': break
                default:
                    return token.throwDebug('unexpected marker')
            }
        case TokenType.MARKER:
        case TokenType.TYPE:
            return token.throwDebug('unexpected')
        default:
            return exhaust(token.type)
    }
}
