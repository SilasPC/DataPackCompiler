
import { TokenType } from "../lexing/Token";
import { ASTNode, ASTNodeType, ASTCmdNode } from "./AST";
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
                    default:
                        // ehm. I don't think I've implemented keywords in the expr parser
                        // lol
                        body.push(expressionSyntaxParser(iter.skip(-1),ctx).ast)
                        break
                }
                break
            }
            case TokenType.COMMAND: {
                let node: ASTCmdNode = {
                    type: ASTNodeType.COMMAND,
                    cmd: iter.current().value
                }
                body.push(node)
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
