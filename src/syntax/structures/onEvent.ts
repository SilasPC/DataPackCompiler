
import { ASTOnNode } from "../AST"
import { KeywordToken } from "../../lexing/Token"
import { bodySyntaxParser } from "../bodySyntaxParser"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { Result, ResultWrapper } from "../../toolbox/Result"
import { parseStaticAccess } from "./staticAccess"

export function parseOnEvent(iter:TokenIteratorI,ctx:CompileContext): Result<ASTOnNode,null> {
    const result = new ResultWrapper<ASTOnNode,null>()
    let onToken = iter.current() as KeywordToken
    let identifier = parseStaticAccess(iter)
    iter.next().expectValue('{')
    let bodyRes = bodySyntaxParser(iter,ctx)
    if (result.merge(bodyRes)) return result.none()
    return result.wrap(new ASTOnNode(iter.file,onToken.indexStart,iter.current().indexEnd,identifier,bodyRes.getValue()))
}