import { CompileContext } from "../../toolbox/CompileContext";
import { lexer } from "../../lexing/lexer";
import { ParsingFile } from "../../toolbox/ParsingFile";
import { compileStdlibFunction } from "../compileFunction";
import { ElementaryValueType } from "../../semantics/Types";

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
	return compileStdlibFunction(md,'identity',ctx,{elementary:true,type:ElementaryValueType.INT})
}

export function createDouble(ctx:CompileContext) {
	return compileStdlibFunction(fn,'double',ctx,null)
}