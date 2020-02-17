
import { ASTEventNode, ASTBody, ASTStaticAccessNode } from "../AST"
import { TokenType, KeywordToken, GenericToken, DirectiveToken } from "../../lexing/Token"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { bodySyntaxParser } from "../bodySyntaxParser"

export function parseEvent(iter:TokenIteratorI,ctx:CompileContext): ASTEventNode {
    let eventToken = iter.current() as KeywordToken
    let identifier = iter.next().expectType(TokenType.SYMBOL) as GenericToken
    let body: ASTBody | null = null
    let extend: ASTStaticAccessNode | null = null
    if (iter.peek().value == 'extends') {
        throw iter.peek().error('no extend event yet, do :: parser first')
    }
    if (iter.peek().value == '{')
        body = bodySyntaxParser(iter.skip(1),ctx)
    return new ASTEventNode(iter.file,eventToken.indexStart,iter.current().indexEnd,identifier,extend,body)
}