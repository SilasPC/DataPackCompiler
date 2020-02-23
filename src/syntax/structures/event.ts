
import { ASTEventNode, ASTBody, ASTIdentifierNode } from "../AST"
import { TokenType, KeywordToken, GenericToken, DirectiveToken } from "../../lexing/Token"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { bodySyntaxParser } from "../bodySyntaxParser"
import { Result, ResultWrapper } from "../../toolbox/Result"
import { parseStaticAccess } from "./staticAccess"

export function parseEvent(iter:TokenIteratorI,ctx:CompileContext): Result<ASTEventNode,null> {
    const result = new ResultWrapper<ASTEventNode,null>()
    let eventToken = iter.current() as KeywordToken
    let identifier = iter.next().expectType(TokenType.SYMBOL) as GenericToken
    let body: ASTBody | null = null
    let extend: ASTIdentifierNode | null = null
    if (iter.peek().value == 'extends')
        extend = parseStaticAccess(iter.skip(1))
    if (iter.peek().value == '{') {
        let res = bodySyntaxParser(iter.skip(1),ctx)
        if (result.merge(res)) return result.none()
        body = res.getValue()
    }
    return result.wrap(new ASTEventNode(iter.file,eventToken.indexStart,iter.current().indexEnd,identifier,extend,body))
}