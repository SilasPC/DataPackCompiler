import { CompileContext } from "../../toolbox/CompileContext";
import { lexer } from "../../lexing/lexer";
import { ParsingFile } from "../../toolbox/ParsingFile";
import { compileStdlibFunction } from "../compileFunction";

const fn = `
export fn abs(num:int): int {
	let ret: int = num
	if (num < 0) ret += -2 * num;
	return ret;
}
`

export function createAbs(ctx:CompileContext) {
	return compileStdlibFunction(fn,'abs',ctx,null)
}