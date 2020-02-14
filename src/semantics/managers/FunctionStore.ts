import { PTBody, PTStatement } from "../ParseTree"
import { Interspercer } from "../../toolbox/Interspercer"
import { FnDeclaration, EventDeclaration } from "../declarations/Declaration"

export class FunctionStore {

	public readonly init: PTBody = new Interspercer<PTStatement,string>()
	private readonly fns = new Map<FnDeclaration,PTBody>()
	private readonly events = new Map<EventDeclaration,PTBody[]>()

	addFn(decl:FnDeclaration,body:PTBody) {
		if (this.fns.has(decl)) throw new Error('tried resetting fn decl body')
		this.fns.set(decl,body)
	}

	appendToEvent(decl:EventDeclaration,body:PTBody) {
		if (this.events.has(decl)) (this.events.get(decl) as PTBody[]).push(body)
		else this.events.set(decl,[body])
	}

	fnEntries() {return this.fns.entries()}

	eventEntries() {return this.events.entries()}

}
