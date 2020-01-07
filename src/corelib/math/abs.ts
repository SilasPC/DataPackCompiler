import { CompileContext } from "../../toolbox/CompileContext";
import { lexer } from "../../lexing/lexer";
import { ParsingFile } from "../../toolbox/ParsingFile";
import { compileCoreFunction } from "./compileFunction";

const fn = `
fn abs(this:int): int {
	if (this < 0) this += -2 * this;
	return this;
}
`

export function createAbs(ctx:CompileContext) {

	

	compileCoreFunction(fn,'abs',ctx)

}