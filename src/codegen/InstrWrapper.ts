import { Instruction } from "./Instructions";
import $ from "js-itertools";

export class InstrWrapper {

	private comments = new Map<number,string[]>()
	private instrs: Instruction[] = []
	private looping = -1

	clone() {
		let ret = new InstrWrapper()
		for (let [k,v] of this.comments)
			ret.comments.set(k,[...v])
		ret.instrs = [...this.instrs]
		return ret
	}

	getInstrs(): ReadonlyArray<Instruction> {return this.instrs}

	getLength() {return this.instrs.length}

	insert(i:number,w:InstrWrapper): this {
		if (this.looping > i) throw new Error('concurrent modification')
		// shift comments forwards
		$(this.comments.keys())
			.filter(k=>k>=i)
			.toArray()
			.sort((a,b)=>b-a)
			.forEach(k=>{
				if (this.comments.has(k+w.getLength())) throw new Error('sourcemap shifting failed')
				this.comments.set(k+w.getLength(),this.comments.get(k) as string[])
				this.comments.delete(k+w.getLength())
			})
		// insert new comments
		for (let [k,v] of w.comments.entries()) {
			if (this.comments.has(i+k)) throw new Error('sourcemap insertion failed')
			this.comments.set(i+k,v)
		}
		// insert code
		this.instrs.splice(i,0,...w.instrs)
		return this
	}

	insertEnd(w:InstrWrapper): this {
		let n = this.instrs.length
		// insert new comments
		for (let [k,v] of w.comments.entries()) {
			if (k+n in this.comments) throw new Error('sourcemap insertion failed')
			this.comments.set(k+n,v)
		}
		// insert code
		this.instrs.push(...w.instrs)
		return this
	}

	forEachReverse(cb:(instr:Instruction,i:number)=>void): this {
		for (let i = this.instrs.length - 1; i >= 0; i--) {
			this.looping = i
			cb(this.instrs[i],i)
		}
		this.looping = -1
		return this
	}

	remove(i:number,c:number): this {
		if (this.looping > i) throw new Error('concurrent modification')
		// delete comments
		for (let n of this.comments.keys()) {
			if (n >= i && n < i+c)
				this.comments.delete(n)
		}
		this.instrs.splice(i,c)
		// shift comments backwards
		$(this.comments.keys())
			.filter(k=>k>=i+c)
			.toArray()
			.sort((a,b)=>a-b)
			.forEach(k=>{
				if (this.comments.has(k-c)) throw new Error(`sourcemap shifting failed ${k} -> ${k-c} (${i},${c})`)
				this.comments.set(k-c,this.comments.get(k) as string[])
				this.comments.delete(k)
			})
			return this
	}

	addComments(...cmts:string[]): this {
		let cur = this.comments.get(this.instrs.length)
		if (!cur)
			this.comments.set(this.instrs.length,cmts)
		else
			cur.push(...cmts)
		return this
	}

	add(...instrs:Instruction[]): this {
		this.instrs.push(...instrs)
		return this
	}

	*interateInto(out:string[]) {
		/*if (!emitComments) yield* this.instrs.values()
		else*/ for (let [i,val] of this.instrs.entries()) {
			if (this.comments.has(i))
				out.push(...(this.comments.get(i) as string[]).map(c=>'#'+c))
			yield val
		}
	}

}