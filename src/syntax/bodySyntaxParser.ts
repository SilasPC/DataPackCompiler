
import { TokenType, TokenI } from "../lexing/Token";
import { ASTNode, ASTNodeType, ASTReturnNode, ASTStatement } from "./AST";
import { expressionSyntaxParser } from "./expressionSyntaxParser";
import { parseConditional } from "./structures/conditional";
import { parseDeclaration } from "./structures/declaration";
import { TokenIteratorI, TokenIterator } from "../lexing/TokenIterator";
import { exhaust } from "../toolbox/other";
import { CompileContext } from "../toolbox/CompileContext";

export function bodyOrLineSyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTStatement[] {
    if (iter.next().type == TokenType.MARKER && iter.current().value == '{')
        return bodySyntaxParser(iter,ctx)
    else
        return [lineSyntaxParser(iter,ctx)]
}

export function bodySyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTStatement[] {
    let body: ASTStatement[] = []
    loop:
    for (let token of iter) {
        if (token.type == TokenType.MARKER && token.value == '}') return body
        body.push(lineSyntaxParser(iter,ctx))
    }
    throw new Error('body ran out, end of file')
}

export function lineSyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTStatement {
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
                        node: expressionSyntaxParser(iter,ctx,true).ast
                    }
                }
                case 'fn':
                case 'break':
                case 'for':
                case 'event':
                case 'while':
                case 'const':
                    return token.throwDebug('keyword not implemented')
                case 'var':
                case 'export':
                case 'else':
                case 'from':
                case 'import':
                case 'tick':
                case 'class':
                case 'namespace':
                case 'ref':
                    return token.throwDebug('keyword invalid here')
                default:
                    return exhaust(token.value)
            }
        }
        case TokenType.COMMAND:
            let res = ctx.syntaxSheet.readSyntax(iter.current(),ctx)
            if (!res.value) throw new Error('xxx')
            return res.value
        case TokenType.OPERATOR:
        case TokenType.PRIMITIVE:
        case TokenType.SYMBOL:
            return expressionSyntaxParser(iter.skip(-1),ctx,true).ast
        case TokenType.MARKER:
            switch (token.value) {
                case ';': break
                case '(':
                    return expressionSyntaxParser(iter.skip(-1),ctx,true).ast
                default:
                    return token.throwDebug('unexpected marker')
            }
        case TokenType.MARKER:
        case TokenType.TYPE:
            return token.throwDebug('unexpected')
        default:
            return exhaust(token)
    }
}
