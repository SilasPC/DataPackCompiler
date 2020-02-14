
import { TokenType, TokenI, DirectiveToken } from "../lexing/Token";
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
    let res = lineSyntaxParser([],iter,ctx)
    if (res) return [res]
    return []
}

export function bodySyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTStatement[] {
    let body: ASTStatement[] = []
    
    let dirs: DirectiveToken[] = []
    let clearDirs = false

    for (let token of iter) {

        if (clearDirs) {
            dirs = []
            clearDirs = false
        }
        if (token.type == TokenType.DIRECTIVE) {
            dirs.push(token)
            continue
        } else clearDirs = true

        if (token.type == TokenType.MARKER && token.value == '}') return body
        let res = lineSyntaxParser(dirs,iter,ctx)
        if (res) body.push(res)

    }
    throw new Error('body ran out, end of file')
}

export function lineSyntaxParser(dirs:DirectiveToken[],iter:TokenIteratorI,ctx:CompileContext): null | ASTStatement {
    const token = iter.current()
    switch (token.type) {
        case TokenType.KEYWORD: {
            switch (token.value) {
                case 'const':
                case 'let': return parseDeclaration(dirs,iter,ctx)
                case 'if':  return parseConditional(dirs,iter,ctx)
                case 'return': {
                    let peek = iter.peek()
                    if ( // this is not so great
                        iter.newLineFollows() ||
                        peek.value == ';'
                    ) {
                        if (peek.value == ';') iter.skip(1)
                        return new ASTReturnNode(iter.file,token.indexStart,token.indexEnd,dirs,null)
                    } else {
                        let res = expressionSyntaxParser(iter,ctx,true).ast
                        return new ASTReturnNode(iter.file,token.indexStart,res.indexEnd,dirs,res)
                    }
                }
                case 'while':
                    return parseWhile(dirs,iter,ctx)
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
                case 'pub':
                    return token.throwDebug('keyword invalid here')
                default:
                    return exhaust(token.value)
            }
        }
        case TokenType.COMMAND:
            let res = ctx.syntaxSheet.readSyntax(dirs,iter.current(),ctx)
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
        case TokenType.DIRECTIVE:
            return token.throwDebug('unexpected')
        default:
            return exhaust(token)
    }
}
