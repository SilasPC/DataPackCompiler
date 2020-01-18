
import { TokenType, TokenI, KeywordToken } from "../lexing/Token";
import { ASTExportNode, ASTNodeType, ASTStaticDeclaration } from "./AST";
import { TokenIteratorI } from "../lexing/TokenIterator";

export function getType(iter:TokenIteratorI): TokenI | null {
    if (iter.peek().value != ':') return null
    iter.next().expectType(TokenType.MARKER).expectValue(':')
    return iter.next().expectType(TokenType.SYMBOL,TokenType.TYPE)
}

export function wrapExport(node:Exclude<ASTStaticDeclaration,ASTExportNode>,keyword:KeywordToken|null): ASTStaticDeclaration {
    if (keyword) {
        return new ASTExportNode(node.pfile,keyword.indexStart,node.indexEnd,node)
    }
    return node
}
