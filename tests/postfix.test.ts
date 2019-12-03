import { ParsingFile } from "../src/lexing/ParsingFile";
import { expressionSyntaxParser } from "../src/syntax/expressionSyntaxParser";

export default function test() {

	ParsingFile.fromSource('a * b + c + d').

}

function postfix(infix:string) {
	let pfile = ParsingFile.fromSource(infix)
	expressionSyntaxParser(pfile.getTokenIterator())
}