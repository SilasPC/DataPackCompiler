
import { TokenType, Token } from "../lexing/Token";
import { ASTNode, ASTNodeType, ASTReturnNode } from "./AST";
import { expressionSyntaxParser } from "./expressionSyntaxParser";
import { parseConditional } from "./structures/conditional";
import { parseDeclaration } from "./structures/declaration";
import { TokenIteratorI } from "../lexing/TokenIterator";
import { exhaust } from "../toolbox/other";
import { CompileContext } from "../toolbox/CompileContext";

export function bodySyntaxParser(iter:TokenIteratorI,ctx:CompileContext): ASTNode[] {
    let body: ASTNode[] = []
    loop:
    for (let token of iter) {
        switch (token.type) {
            case TokenType.KEYWORD: {
                switch (token.value) {
                    case 'let':
                        body.push(parseDeclaration(iter,ctx))
                        break
                    case 'if':
                        body.push(parseConditional(iter,ctx))
                        break
                    case 'return': {
                        // Later on, the expression parser must return a void type instead
                        // This should happen, as it should be able to parse everything
                        // using the shunting-yard algorithm
                        // That is a bit ambitious, but it sounds quite neat :D
                        // That also makes all this redundant anyways
                        if (iter.peek().type == TokenType.MARKER && iter.peek().value == ';')
                            body.push({
                            type: ASTNodeType.RETURN,
                            node: null
                        })
                        else body.push({
                            type: ASTNodeType.RETURN,
                            node: expressionSyntaxParser(iter,ctx).ast
                        })
                        break
                    }
                    default:
                        // ehm. I don't think I've implemented keywords in the expr parser
                        // lol
                        throw new Error('keywords cannot be passed to expr parser yet')
                        body.push(expressionSyntaxParser(iter.skip(-1),ctx).ast)
                        break
                }
                break
            }
            case TokenType.COMMAND: {
                body.push(ctx.syntaxSheet.readSyntax(iter.current(),ctx))
                break
            }
            case TokenType.OPERATOR:
            case TokenType.PRIMITIVE:
            case TokenType.SYMBOL:
                body.push(expressionSyntaxParser(iter.skip(-1),ctx).ast)
                break
            case TokenType.MARKER:
                switch (token.value) {
                    case ';': break
                    case '}': return body
                    default:
                        return token.throwDebug('unexpected')
                }
                break
            case TokenType.MARKER:
            case TokenType.TYPE:
                return token.throwDebug('unexpected')
            default:
                return exhaust(token.type)
        }
    }
    throw new Error('ran out of tokens lol')
}
