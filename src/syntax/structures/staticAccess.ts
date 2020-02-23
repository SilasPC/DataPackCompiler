import { TokenIteratorI } from "../../lexing/TokenIterator";
import { ASTIdentifierNode } from "../AST";
import { GenericToken, TokenType } from "../../lexing/Token";

export function parseStaticAccess(iter:TokenIteratorI): ASTIdentifierNode {
    let id = iter.next() as GenericToken
    let accessors = [id]
    while (iter.peek().value == '::')
        accessors.push(iter.skip(1).next().expectType(TokenType.SYMBOL) as GenericToken)

    return new ASTIdentifierNode(iter.file,id.indexStart,accessors[accessors.length-1].indexEnd,accessors)
}