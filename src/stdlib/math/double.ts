import { CompileContext } from "../../toolbox/CompileContext";
import { lexer } from "../../lexing/lexer";
import { ParsingFile } from "../../toolbox/ParsingFile";
import { compileStdlibFunction } from "../compileFunction";
import { Type } from "../../semantics/types/Types";

const fn = `
export fn double(num:int): int {
	return 2 * num
}
`

const md  = `
fn identity(): int {
	return this
}
`

export function createIdentity(ctx:CompileContext) {
	return compileStdlibFunction(md,'identity',ctx,{type:Type.INT})
}

export function createDouble(ctx:CompileContext) {
	return compileStdlibFunction(fn,'double',ctx,null)
}