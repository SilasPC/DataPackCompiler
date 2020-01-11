import { CompileContext } from "../../toolbox/CompileContext";
import { lexer } from "../../lexing/lexer";
import { ParsingFile } from "../../toolbox/ParsingFile";
import { compileCoreFunction } from "../compileFunction";

const fn = `
export fn double(num:int): int {
	return 2 * num
}
`

export function createDouble(ctx:CompileContext) {
	return compileCoreFunction(fn,'double',ctx)
}