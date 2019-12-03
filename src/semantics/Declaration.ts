
import { ASTFnNode, ASTLetNode } from "../syntax/AST";
import { ValueType, ValueTypes } from "./Types";
import { unionize, ofType, UnionOf } from "unionize";

export type Declaration = UnionOf<typeof Declarations>
export const Declarations = unionize({
	VARIABLE: ofType<{node:ASTLetNode,type:ValueType}>(),
	FUNCTION: ofType<{node:ASTFnNode,type:ValueType}>()
})
