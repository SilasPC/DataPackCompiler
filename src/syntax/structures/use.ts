
import { ASTUseNode } from "../AST"
import { TokenI, KeywordToken, TokenType, GenericToken } from "../../lexing/Token"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { parseStaticAccess } from "./staticAccess"

export function parseUse(iter:TokenIteratorI,ctx:CompileContext): ASTUseNode {
	let useToken = iter.current() as KeywordToken
	let identifier = parseStaticAccess(iter)
	
	return new ASTUseNode(iter.file,useToken.indexStart,identifier.indexEnd,useToken,identifier)
}
