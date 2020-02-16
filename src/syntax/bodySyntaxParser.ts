
import { TokenType, TokenI, DirectiveToken } from "../lexing/Token";
import { ASTNode, ASTNodeType, ASTReturnNode, ASTStatement, ASTBody } from "./AST";
import { expressionSyntaxParser } from "./expressionSyntaxParser";
import { parseConditional } from "./structures/conditional";
import { parseDeclaration } from "./structures/declaration";
import { TokenIteratorI, TokenIterator } from "../lexing/TokenIterator";
import { exhaust } from "../toolbox/other";
import { CompileContext } from "../toolbox/CompileContext";
import { parseWhile } from "./structures/while";
import { Interspercer } from "../toolbox/Interspercer";

export function bodyOrLineSyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTBody {
    let next = iter.next()
    if (next && next.type == TokenType.MARKER && iter.current().value == '{')
        return bodySyntaxParser(iter,ctx)
    let res = lineSyntaxParser(iter,ctx)
    let body: ASTBody = new Interspercer()
    if (res) return body.add(res)
    return body
}

export function bodySyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTBody {
    
    let body: ASTBody = new Interspercer()

    for (let token of iter) {

        if (token.type == TokenType.DIRECTIVE) {
            body.addSubData(token)
            continue
        }

        if (token.type == TokenType.MARKER && token.value == '}') return body
        let res = lineSyntaxParser(iter,ctx)
        if (res) body.add(res)

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
                    let peek = iter.peek()
                    if ( // this is not so great
                        iter.newLineFollows() ||
                        peek.value == ';'
                    ) {
                        if (peek.value == ';') iter.skip(1)
                        return new ASTReturnNode(iter.file,token.indexStart,token.indexEnd,null)
                    } else {
                        let res = expressionSyntaxParser(iter,true).ast
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
                case 'pub':
                    return token.throwDebug('keyword invalid here')
                default:
                    return exhaust(token.value)
            }
        }
        case TokenType.COMMAND:
            let res = ctx.syntaxSheet.readSyntax(iter.current(),ctx.logger)
            if (res.value) return res.value
            return null
        case TokenType.OPERATOR:
        case TokenType.PRIMITIVE:
        case TokenType.SYMBOL:
        case TokenType.SELECTOR:
            return expressionSyntaxParser(iter.skip(-1),true).ast
        case TokenType.MARKER:
            switch (token.value) {
                case ';': break
                case '(':
                    return expressionSyntaxParser(iter.skip(-1),true).ast
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
