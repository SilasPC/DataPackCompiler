
import unionize, { ofType, UnionOf } from "unionize";

export type Lineal = UnionOf<typeof Lineals>
export const Lineals = unionize({
	ADD_SCORE: {},
	SUB_SCORE: {},
	MULT_SCORE: {},
	DIV_SCORE: {},
	MOD_SCORE: {},
	CMD: {}
})
