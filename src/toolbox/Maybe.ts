
export class MaybeWrapper<T> {

	/*static direct(): Maybe<any>
	static direct<T>(v:T): Maybe<T>
	static direct<T>(v?:T|undefined): Maybe<T> {
		return new MaybeClass<T>(v) as Maybe<T>
	}*/

	private hasErrored = false

	/** Return true if maybe had no value. this.noWrap() will be called */
	merge<P>(m:Maybe<P>): m is NoneMaybe<P> {
		let hadVal = typeof m.value != 'undefined'
		if (!hadVal) this.noWrap()
		return !hadVal
	}

	noWrap() {
		this.hasErrored = true
	}

	none(): Maybe<T> {return new MaybeClass<T>() as Maybe<T>}

	wrap(v:T): Maybe<T> {
		if (this.hasErrored) return new MaybeClass<T>() as Maybe<T>
		return new MaybeClass<T>(v) as Maybe<T>
	}

	pass(m:Maybe<T>): Maybe<T> {
		if (this.hasErrored) return this.none()
		return m
	}
	
	map<S,P>(m:Maybe<S>,f:(t:S)=>P): Maybe<P> {
		if (m.value && !this.hasErrored) return new MaybeClass<P>(f(m.value)) as DefiniteMaybe<P>
		return new MaybeClass<P>() as NoneMaybe<P>
	}

}

interface DefiniteMaybe<T> extends MaybeClass<T> {value:T}
interface NoneMaybe<T> extends MaybeClass<T> {value:undefined}

export type Maybe<T> = DefiniteMaybe<T> | NoneMaybe<T>

class MaybeClass<T> {
	constructor(
		public readonly value?: T
	) {}
	pick<P extends keyof T>(k:P): Maybe<T[P]> {
		if (this.value)
			return new MaybeClass<T[P]>(this.value[k]) as Maybe<T[P]>
		return new MaybeClass<T[P]>(undefined) as Maybe<T[P]>
	}
	check(): Maybe<true> {
		if (this.value) return new MaybeClass<true>(true) as Maybe<true>
		return new MaybeClass<true>(undefined) as Maybe<true>
	}
}
