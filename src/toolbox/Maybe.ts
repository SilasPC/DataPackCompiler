
export class MaybeWrapper<T> {

	private hasErrored = false

	/** Return true if maybe had no value. this.noWrap() will be called */
	merge<P>(m:Maybe<P>): m is NoneMaybe {
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

}

interface DefiniteMaybe<T> extends MaybeClass<T> {value:T}
interface NoneMaybe extends MaybeClass<any> {value:undefined}

export type Maybe<T> = DefiniteMaybe<T> | NoneMaybe

class MaybeClass<T> {
	constructor(
		public readonly value?: T
	) {}
}
