
import { TokenType, TokenI, KeywordToken } from "../lexing/Token";
import { ASTNode, ASTExportNode, ASTNodeType, ASTStaticDeclaration } from "./AST";
import { TokenIterator, TokenIteratorI } from "../lexing/TokenIterator";

export function getType(iter:TokenIteratorI): TokenI {
    iter.next().expectType(TokenType.MARKER).expectValue(':')
    return iter.next().expectType(TokenType.SYMBOL,TokenType.TYPE)
}

export function wrapExport(node:ASTStaticDeclaration,keyword:KeywordToken|null): ASTStaticDeclaration {
    if (keyword) {
        let ret: ASTExportNode = {type:ASTNodeType.EXPORT,keyword,node}
        return ret
    }
    return node
}
