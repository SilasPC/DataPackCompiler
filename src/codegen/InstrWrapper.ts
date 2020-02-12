import { Instruction } from "./Instructions";
import $ from "js-itertools";
import { CommentInterspercer } from "../toolbox/CommentInterspercer";

export class InstrWrapper extends CommentInterspercer<Instruction> {

	clone(): InstrWrapper {return new InstrWrapper().insert(0,this)}

	*interateInto(out:string[]) {
		for (let [cmts,val] of this.iterate()) {
			out.push(...cmts.map((c:string)=>'#'+c))
			yield val
		}
	}

}