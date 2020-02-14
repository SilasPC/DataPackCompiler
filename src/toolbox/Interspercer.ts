import $ from "js-itertools";

export class Interspercer<T,P> {

	private subData = new Map<number,P[]>()
	private data: T[] = []
	private looping = -1

	clone() {
		let ret = new Interspercer<T,P>()
		for (let [k,v] of this.subData)
			ret.subData.set(k,[...v])
		ret.data = [...this.data]
		return ret
	}

	getData(): ReadonlyArray<T> {return this.data}
	getLength() {return this.data.length}

	insert(i:number,x:Interspercer<T,P>): this {
		if (this.looping > i) throw new Error('concurrent modification')
		// shift subData forwards
		$(this.subData.keys())
			.filter(k=>k>=i)
			.toArray()
			.sort((a,b)=>b-a)
			.forEach(k=>{
				if (this.subData.has(k+x.getLength())) throw new Error('subData shifting failed')
				this.subData.set(k+x.getLength(),this.subData.get(k) as P[])
				this.subData.delete(k+x.getLength())
			})
		// insert new subData
		for (let [k,v] of x.subData.entries()) {
			if (this.subData.has(i+k)) throw new Error('subData insertion failed')
			this.subData.set(i+k,v)
		}
		// insert data
		this.data.splice(i,0,...x.data)
		return this
	}

	insertEnd(w:Interspercer<T,P>): this {
		let n = this.data.length
		// insert new subData
		for (let [k,v] of w.subData.entries()) {
			if (k+n in this.subData) throw new Error('subData insertion failed')
			this.subData.set(k+n,v)
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
		// delete subData
		for (let n of this.subData.keys()) {
			if (n >= i && n < i+c)
				this.subData.delete(n)
		}
		this.data.splice(i,c)
		// shift subData backwards
		$(this.subData.keys())
			.filter(k=>k>=i+c)
			.toArray()
			.sort((a,b)=>a-b)
			.forEach(k=>{
				if (this.subData.has(k-c)) throw new Error(`subData shifting failed ${k} -> ${k-c} (${i},${c})`)
				this.subData.set(k-c,this.subData.get(k) as P[])
				this.subData.delete(k)
			})
			return this
	}

	addSubData(...cmts:P[]): this {
		let cur = this.subData.get(this.data.length)
		if (!cur)
			this.subData.set(this.data.length,cmts)
		else
			cur.push(...cmts)
		return this
	}

	add(...data:T[]): this {
		this.data.push(...data)
		return this
	}

	*iterate()/*: Generator<[P[],T]>*/ {
		for (let [i,val] of this.data.entries()) {
			if (this.subData.has(i))
				yield [this.subData.get(i) as P[],val] as [readonly P[],T]
			else
				yield [[],val] as [readonly P[],T]
		}
	}

	getTrailingSubData() {
		return $(this.subData)
			.filter(x => x[0] >= this.data.length)
			.map(x => x[1])
			.reduce<P[]>((a,x)=>a.concat(x),[])
	}

}