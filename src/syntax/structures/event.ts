
import { ASTEventNode } from "../AST"
import { TokenType, KeywordToken, GenericToken, DirectiveToken } from "../../lexing/Token"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseEvent(dirs:DirectiveToken[],iter:TokenIteratorI,ctx:CompileContext): ASTEventNode {
    let eventToken = iter.current() as KeywordToken
    let identifier = iter.next().expectType(TokenType.SYMBOL) as GenericToken
    return new ASTEventNode(iter.file,eventToken.indexStart,iter.current().indexEnd,dirs,identifier)
}