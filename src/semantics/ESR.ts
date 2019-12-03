import unionize, { UnionOf, ofType } from "unionize";
import { ASTFnNode } from "../syntax/AST";
import { Declaration } from "./Declaration";

// Expanded semantical representation
// Linearization of expressions

export type ESR = UnionOf<typeof ESRs>
export const ESRs = unionize({
	SCORE: ofType<{mutable:boolean,const:boolean,scoreboard:string,selector:string}>(),
	VOID: {}
})
