
import { ASTFnNode, ASTNodeType, ASTEventNode, ASTIdentifierNode } from "../AST"
import { TokenType, TokenI, KeywordToken, GenericToken } from "../../lexing/Token"
import { bodySyntaxParser } from "../bodySyntaxParser"
import { getType } from "../helpers"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseEvent(iter:TokenIteratorI,ctx:CompileContext): ASTEventNode {
    let fnToken = iter.current() as KeywordToken
    let identifier = iter.next().expectType(TokenType.SYMBOL) as GenericToken
    let parameters: {symbol:TokenI,type:TokenI,ref:boolean}[] = []
    iter.next().expectType(TokenType.MARKER).expectValue('{')
    let body = bodySyntaxParser(iter,ctx)
    return new ASTEventNode(iter.file,fnToken.indexStart,iter.current().indexEnd,
        new ASTIdentifierNode(iter.file,identifier.indexStart,identifier.indexEnd,identifier),
    body)
}