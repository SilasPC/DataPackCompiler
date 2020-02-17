
import { ASTFnNode, ASTNodeType, ASTEventNode, ASTIdentifierNode, ASTStatement, ASTOnNode } from "../AST"
import { TokenType, TokenI, KeywordToken, GenericToken } from "../../lexing/Token"
import { bodySyntaxParser } from "../bodySyntaxParser"
import { getType } from "../helpers"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { Result, ResultWrapper } from "../../toolbox/Result"

export function parseOnEvent(iter:TokenIteratorI,ctx:CompileContext): Result<ASTOnNode,null> {
    const result = new ResultWrapper<ASTOnNode,null>()
    let onToken = iter.current() as KeywordToken
    let identifier = iter.next().expectType(TokenType.SYMBOL) as GenericToken
    iter.next().expectValue('{')
    let bodyRes = bodySyntaxParser(iter,ctx)
    if (result.merge(bodyRes)) return result.none()
    return result.wrap(new ASTOnNode(iter.file,onToken.indexStart,iter.current().indexEnd,
        new ASTIdentifierNode(iter.file,identifier.indexStart,identifier.indexEnd,identifier)
    ,bodyRes.getValue()))
}