import { TokenIteratorI } from "../../lexing/TokenIterator";
import { CompileContext } from "../../toolbox/CompileContext";
import { ASTSelectorNode, ASTNodeType } from "../AST";
import { GenericToken } from "../../lexing/Token";

export function parseSelector(iter:TokenIteratorI): ASTSelectorNode {

	let token = iter.current() as GenericToken

	if (iter.peek().value == '[') {
		if (iter.skip(1).whitespaceBefore() != 0)
			throw new Error('selector whitespace syntax error')
		if (iter.next().value != ']')
			throw new Error('selector syntax error')
	}

	return new ASTSelectorNode(iter.file,token.indexStart,iter.current().indexEnd,token)

}