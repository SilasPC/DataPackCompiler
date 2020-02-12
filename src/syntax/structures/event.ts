
import { ASTFnNode, ASTNodeType, ASTEventNode, ASTIdentifierNode, ASTStatement } from "../AST"
import { TokenType, TokenI, KeywordToken, GenericToken } from "../../lexing/Token"
import { bodySyntaxParser } from "../bodySyntaxParser"
import { getType } from "../helpers"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseEvent(iter:TokenIteratorI,ctx:CompileContext): ASTEventNode {
    let eventToken = iter.current() as KeywordToken
    let identifier = iter.next().expectType(TokenType.SYMBOL) as GenericToken
    return new ASTEventNode(iter.file,eventToken.indexStart,iter.current().indexEnd,identifier)
}