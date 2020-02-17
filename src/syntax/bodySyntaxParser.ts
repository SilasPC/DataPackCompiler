
import { TokenType } from "../lexing/Token";
import { ASTReturnNode, ASTStatement, ASTBody } from "./AST";
import { expressionSyntaxParser } from "./expressionSyntaxParser";
import { parseConditional } from "./structures/conditional";
import { parseDeclaration } from "./structures/declaration";
import { TokenIteratorI, TokenIterator } from "../lexing/TokenIterator";
import { exhaust } from "../toolbox/other";
import { CompileContext } from "../toolbox/CompileContext";
import { parseWhile } from "./structures/while";
import { Interspercer } from "../toolbox/Interspercer";
import { Result, ResultWrapper } from "../toolbox/Result";

export function bodyOrLineSyntaxParser(iter:TokenIteratorI,ctx:CompileContext): Result<ASTBody,null> {
    const result = new ResultWrapper<ASTBody,null>()
    let next = iter.next()
    if (next && next.type == TokenType.MARKER && iter.current().value == '{')
        return result.pass(bodySyntaxParser(iter,ctx))
    let res = parseStatement(iter,ctx)
    let body: ASTBody = new Interspercer()
    if (!result.merge(res)) body.add(res.getValue())
    return result.wrap(body)
}

export function bodySyntaxParser(iter:TokenIteratorI,ctx:CompileContext): Result<ASTBody,null> {
    
    const result = new ResultWrapper<ASTBody,null>()

    let body: ASTBody = new Interspercer()

    for (let token of iter) {

        if (token.type == TokenType.DIRECTIVE) {
            body.addSubData(token)
            continue
        }

        if (token.type == TokenType.MARKER && token.value == '}') return result.wrap(body)
        
        let res = parseStatement(iter,ctx)
        if (!result.merge(res)) body.add(res.getValue())

    }

    result.addError(iter.file.unexpectedEOI())
    return result.none()
}

function parseStatement(iter:TokenIteratorI,ctx:CompileContext): Result<ASTStatement,null> {
    const result = new ResultWrapper<ASTStatement,null>()
    const token = iter.current()
    switch (token.type) {
        case TokenType.KEYWORD: {
            switch (token.value) {
                case 'const':
                case 'let': return result.wrap(parseDeclaration(iter))
                case 'if':  return result.pass(parseConditional(iter,ctx))
                case 'return': {
                    let peek = iter.peek()
                    if ( // this is not so great
                        iter.newLineFollows() ||
                        peek.value == ';'
                    ) {
                        if (peek.value == ';') iter.skip(1)
                        return result.wrap(new ASTReturnNode(iter.file,token.indexStart,token.indexEnd,null))
                    } else {
                        let res = expressionSyntaxParser(iter,true).ast
                        return result.wrap(new ASTReturnNode(iter.file,token.indexStart,res.indexEnd,res))
                    }
                }
                case 'while':
                    return result.pass(parseWhile(iter,ctx))
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
                case 'extends':
                case 'on':
                case 'event':
                case 'pub':
                    return token.throwDebug('keyword invalid here')
                default:
                    return exhaust(token.value)
            }
        }
        case TokenType.COMMAND:
            let res = ctx.syntaxSheet.readSyntax(iter.current())
            if (result.merge(res)) return result.none()
            return result.wrap(res.getValue())
        case TokenType.OPERATOR:
        case TokenType.PRIMITIVE:
        case TokenType.SYMBOL:
        case TokenType.SELECTOR:
            return result.wrap(expressionSyntaxParser(iter.skip(-1),true).ast)
        case TokenType.MARKER:
            switch (token.value) {
                case ';': break
                case '(':
                    return result.wrap(expressionSyntaxParser(iter.skip(-1),true).ast)
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
