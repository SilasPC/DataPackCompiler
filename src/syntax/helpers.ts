
import { TokenType, TokenI } from "../lexing/Token";
import { ASTNode, ASTExportNode, ASTNodeType } from "./AST";
import { TokenIterator, TokenIteratorI } from "../lexing/TokenIterator";

export function getType(iter:TokenIteratorI): TokenI {
    iter.next().expectType(TokenType.MARKER).expectValue(':')
    return iter.next().expectType(TokenType.SYMBOL,TokenType.TYPE)
}

export function wrapExport(node:ASTNode,keyword:TokenI|null): ASTNode {
    if (keyword) {
        let ret: ASTExportNode = {type:ASTNodeType.EXPORT,keyword,node}
        return ret
    }
    return node
}
