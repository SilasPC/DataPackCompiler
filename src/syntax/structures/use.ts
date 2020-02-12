
import { ASTUseNode } from "../AST"
import { TokenI, KeywordToken, TokenType } from "../../lexing/Token"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseUse(iter:TokenIteratorI,ctx:CompileContext): ASTUseNode {
	let useToken = iter.current() as KeywordToken
	let accessors: TokenI[] = []

	while (true) {
		accessors.push(iter.next().expectType(TokenType.SYMBOL))
		if (iter.peek().value != '::') break
		iter.skip(1)
	}
	
	return new ASTUseNode(iter.file,useToken.indexStart,accessors[accessors.length-1].indexEnd,useToken,accessors)
}
