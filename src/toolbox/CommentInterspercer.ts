import $ from "js-itertools";

export class CommentInterspercer<T> {

	private comments = new Map<number,string[]>()
	private data: T[] = []
	private looping = -1

	clone() {
		let ret = new CommentInterspercer<T>()
		for (let [k,v] of this.comments)
			ret.comments.set(k,[...v])
		ret.data = [...this.data]
		return ret
	}

	getData(): ReadonlyArray<T> {return this.data}
	getLength() {return this.data.length}

	insert(i:number,x:CommentInterspercer<T>): this {
		if (this.looping > i) throw new Error('concurrent modification')
		// shift comments forwards
		$(this.comments.keys())
			.filter(k=>k>=i)
			.toArray()
			.sort((a,b)=>b-a)
			.forEach(k=>{
				if (this.comments.has(k+x.getLength())) throw new Error('comment shifting failed')
				this.comments.set(k+x.getLength(),this.comments.get(k) as string[])
				this.comments.delete(k+x.getLength())
			})
		// insert new comments
		for (let [k,v] of x.comments.entries()) {
			if (this.comments.has(i+k)) throw new Error('sourcemap insertion failed')
			this.comments.set(i+k,v)
		}
		// insert data
		this.data.splice(i,0,...x.data)
		return this
	}

	insertEnd(w:CommentInterspercer<T>): this {
		let n = this.data.length
		// insert new comments
		for (let [k,v] of w.comments.entries()) {
			if (k+n in this.comments) throw new Error('sourcemap insertion failed')
			this.comments.set(k+n,v)
		}
		// insert data
		this.data.push(...w.data)
		return this
	}

	forEachReverse(cb:(val:T,i:number)=>void): this {
		for (let i = this.data.length - 1; i >= 0; i--) {
			this.looping = i
			cb(this.data[i],i)
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
		this.data.splice(i,c)
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
		let cur = this.comments.get(this.data.length)
		if (!cur)
			this.comments.set(this.data.length,cmts)
		else
			cur.push(...cmts)
		return this
	}

	add(...data:T[]): this {
		this.data.push(...data)
		return this
	}

	*iterate()/*: Generator<[string[],T]>*/ {
		for (let [i,val] of this.data.entries()) {
			if (this.comments.has(i))
				yield [this.comments.get(i) as string[],val] as [string[],T]
			else
				yield [[],val] as [string[],T]
		}
	}

}