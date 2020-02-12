
import { TokenType, TokenI } from "../lexing/Token";
import { ASTNode, ASTNodeType, ASTReturnNode, ASTStatement } from "./AST";
import { expressionSyntaxParser } from "./expressionSyntaxParser";
import { parseConditional } from "./structures/conditional";
import { parseDeclaration } from "./structures/declaration";
import { TokenIteratorI, TokenIterator } from "../lexing/TokenIterator";
import { exhaust } from "../toolbox/other";
import { CompileContext } from "../toolbox/CompileContext";
import { parseWhile } from "./structures/while";

export function bodyOrLineSyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTStatement[] {
    let next = iter.next()
    if (next && next.type == TokenType.MARKER && iter.current().value == '{')
        return bodySyntaxParser(iter,ctx)
    let res = lineSyntaxParser(iter,ctx)
    if (res) return [res]
    return []
}

export function bodySyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTStatement[] {
    let body: ASTStatement[] = []
    loop:
    for (let token of iter) {
        if (token.type == TokenType.MARKER && token.value == '}') return body
        let res = lineSyntaxParser(iter,ctx)
        if (res) body.push(res)
    }
    throw new Error('body ran out, end of file')
}

export function lineSyntaxParser(iter:TokenIteratorI,ctx:CompileContext): null | ASTStatement {
    const token = iter.current()
    switch (token.type) {
        case TokenType.KEYWORD: {
            switch (token.value) {
                case 'const':
                case 'let': return parseDeclaration(iter,ctx)
                case 'if':  return parseConditional(iter,ctx)
                case 'return': {
                    // Later on, the expression parser must return a void type instead
                    // This should happen, as it should be able to parse everything
                    // using the shunting-yard algorithm
                    // That is a bit ambitious, but it sounds quite neat :D
                    // That also makes all this redundant anyways
                    let peek = iter.peek()
                    if (
                        !peek ||
                        (peek.type == TokenType.MARKER && peek.value == ';')
                    )
                        return new ASTReturnNode(iter.file,token.indexStart,token.indexEnd,null)
                    else {
                        let res = expressionSyntaxParser(iter,ctx,true).ast
                        return new ASTReturnNode(iter.file,token.indexStart,res.indexEnd,res)
                    }
                }
                case 'while':
                    return parseWhile(iter,ctx)
                case 'fn':
                case 'break':
                case 'for':
                case 'use':
                    return token.throwDebug('keyword not implemented')
                case 'var':
                case 'else':
                case 'class':
                case 'mod':
                case 'ref':
                case 'recipe':
                case 'struct':
                case 'implements':
                case 'on':
                case 'event':
                    return token.throwDebug('keyword invalid here')
                default:
                    return exhaust(token.value)
            }
        }
        case TokenType.COMMAND:
            let res = ctx.syntaxSheet.readSyntax(iter.current(),ctx)
            if (res.value) return res.value
            return null
        case TokenType.OPERATOR:
        case TokenType.PRIMITIVE:
        case TokenType.SYMBOL:
        case TokenType.SELECTOR:
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
