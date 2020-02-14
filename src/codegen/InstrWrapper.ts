import { Instruction } from "./Instructions";
import { Interspercer } from "../toolbox/Interspercer";

export class InstrWrapper extends Interspercer<Instruction,string> {

	clone(): InstrWrapper {return new InstrWrapper().insert(0,this)}

	*interateInto(out:string[]) {
		for (let [cmts,val] of this.iterate()) {
			out.push(...cmts.map((c:string)=>'#'+c))
			yield val
		}
	}

}