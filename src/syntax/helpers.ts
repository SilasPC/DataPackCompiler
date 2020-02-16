
import { TokenType, TokenI, KeywordToken } from "../lexing/Token";
import { ASTPublicNode, ASTStaticDeclaration } from "./AST";
import { TokenIteratorI } from "../lexing/TokenIterator";

export function getType(iter:TokenIteratorI): TokenI | null {
    if (iter.peek().value != ':') return null
    iter.next().expectType(TokenType.MARKER).expectValue(':')
    return iter.next().expectType(TokenType.SYMBOL,TokenType.TYPE)
}

export function wrapPublic(node:Exclude<ASTStaticDeclaration,ASTPublicNode>,keyword:KeywordToken|null): ASTStaticDeclaration {
    if (keyword) {
        return new ASTPublicNode(node.mod,keyword.indexStart,node.indexEnd,node)
    }
    return node
}
