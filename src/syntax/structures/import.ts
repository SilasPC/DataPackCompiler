
import { ASTLetNode, ASTNodeType, ASTImportNode } from "../AST"
import { expressionSyntaxParser } from "../expressionSyntaxParser"
import { getType } from "../helpers"
import { TokenType, TokenI, KeywordToken, GenericToken } from "../../lexing/Token"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"

export function parseImport(iter:TokenIteratorI,ctx:CompileContext): ASTImportNode {
    let importToken = iter.current() as KeywordToken
		iter.next().expectType(TokenType.MARKER).expectValue('{')
		let imports: TokenI[] = []
		while (iter.peek().value != '}') {
			imports.push(iter.next().expectType(TokenType.SYMBOL))
			if (iter.peek().value != ',') break
			iter.skip(1)
		}
		iter.next().expectType(TokenType.MARKER).expectValue('}')
		let fromToken = iter.next().expectType(TokenType.KEYWORD).expectValue('from') as KeywordToken
		let source = iter.next().expectType(TokenType.PRIMITIVE) as GenericToken
		if (!source.value.startsWith('\'')) source.throwDebug('expected string')
    return {
        type: ASTNodeType.IMPORT,
				keyword: importToken,
				keyword2: fromToken,
				imports,
				source
    }
}
