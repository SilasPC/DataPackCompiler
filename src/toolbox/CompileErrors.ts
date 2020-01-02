
export class CompileErrorSet extends Error implements PossibleFunc<never> {

	private readonly errors: CompileError[] = []

	constructor(...errors:CompileError[]) {
		super('Compilation error')
		this.errors.push(...errors)
	}

	getErrors() {return this.errors}
	hasError() {return true}
	hasValue() {return false}

	isEmpty() {
		return this.errors.length == 0
	}

	getCount() {
		return this.errors.length
	}

	merge(set:CompileErrorSet): this {
		this.errors.push(...set.errors)
		return this
	}

	/** 
	 * Type guard for possible having a value.
	 * If not, errors are merged into this
	 */
	checkHasValue<T>(pos:Possible<T>): pos is DefinitePossible<T> {
		if (pos.hasError()) {
			this.merge(pos)
			return false
		}
		if (!pos.hasValue()) throw new Error('possible must have value or error')
		return true
	}

	push(...errors:CompileError[]): this {
		this.errors.push(...errors)
		return this
	}

	wrap<T>(): Possible<T>
	wrap<T>(val:Possible<T>): Possible<T>
	wrap<T>(val:T): Possible<T>
	wrap<T>(val?:T|Possible<T>): Possible<T> {
		if (typeof val == 'undefined') return this
		if (isPossible<T,T>(val)) {
			if (val.hasError()) return this.merge(val)
			return val
		}
		if (!this.isEmpty()) return this
		return new DefinitePossible<T>(val)
	}

}

function isPossible<T,P>(val:T|Possible<P>): val is Possible<P> {
	return (
		val instanceof DefinitePossible ||
		val instanceof CompileErrorSet
	)
}

export type Possible<T> = PossibleFunc<T> & (DefinitePossible<T> | CompileErrorSet)

interface PossibleFunc<T> {
	hasValue(): this is DefinitePossible<T>
	hasError(): this is CompileErrorSet
}

class DefinitePossible<T> implements PossibleFunc<T> {

	constructor(public readonly value: T) {}

	hasError() {return false}
	hasValue() {return true}

}

export class CompileError extends Error {

	constructor(
		/*public readonly pfile: ParsingFile,
		public readonly indexStart: number,
		public readonly indexEnd: number,
		public readonly msg: string*/
		private readonly errorString: string
	) {
		super('Compilation error')
	}

	getErrorString() {
		return this.errorString
	}

}