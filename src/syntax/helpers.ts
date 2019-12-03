
import { TokenType, Token } from "../lexing/Token";
import { ASTNode, ASTExportNode, ASTNodeType } from "./AST";
import { TokenIterator } from "../lexing/TokenIterator";

export function getType(iter:TokenIterator): Token {
    iter.next().expectType(TokenType.MARKER).expectValue(':')
    return iter.next().expectType(TokenType.SYMBOL)
}

export function wrapExport(node:ASTNode,wrap:boolean): ASTNode {
    if (wrap) {
        let ret: ASTExportNode = {type:ASTNodeType.EXPORT,node}
        return ret
    }
    return node
}
