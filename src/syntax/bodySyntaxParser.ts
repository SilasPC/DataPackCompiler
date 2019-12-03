
import { TokenType } from "../lexing/Token";
import { ASTNode, ASTNodeType, ASTCmdNode } from "./AST";
import { expressionSyntaxParser } from "./expressionSyntaxParser";
import { parseConditional } from "./structures/conditional";
import { parseDeclaration } from "./structures/declaration";
import { TokenIterator } from "../lexing/TokenIterator";
import { SyntaxParser } from "./SyntaxParser";

export function bodySyntaxParser(iter:TokenIterator) {
    let body: ASTNode[] = []
    parser.consume(iter,body)
    return body
}

const parser: SyntaxParser<ASTNode[]> = new SyntaxParser('body')

parser
    .usingType(TokenType.KEYWORD)
    .case('let',(iter,body)=>{
        body.push(parseDeclaration(iter))
    })
    .case('if',(iter,body)=>{
        body.push(parseConditional(iter))
    })
parser
    .usingType(TokenType.COMMAND)
    .fallback((iter,body)=>{
        let node: ASTCmdNode = {
            type: ASTNodeType.COMMAND,
            cmd: iter.current().value
        }
        body.push(node)
    })
parser
    .usingType(TokenType.SYMBOL)
    .fallback((iter,body)=>{
        iter.skip(-1)
        body.push(expressionSyntaxParser(iter))
    })
parser
    .usingType(TokenType.MARKER)
    .case('}',()=>true)
    .case(';',()=>{})

parser
    .fallback((iter,body)=>{
        body.push(expressionSyntaxParser(iter.skip(-1)))
    })
