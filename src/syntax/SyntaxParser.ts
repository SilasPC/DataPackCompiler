import { TokenType } from "../lexing/Token";
import { TokenIterator } from "../lexing/TokenIterator";

type handle<T> = (iter:TokenIterator,context:T) => boolean|void

export class SyntaxParser<T> {

	private handles: Map<TokenType,Map<string,handle<T>>> = new Map()
	private fallbacks: Map<TokenType,handle<T>> = new Map()
	private finalFallback: handle<T>|null = null

	constructor(
		public readonly name: string
	) {}

	usingType(type:TokenType) {
		let handles = this.handles.get(type) || <Map<string,handle<T>>>this.handles.set(type,new Map()).get(type)
		let self = this
		return {
			case(val:string,handle:handle<T>) {
				if (handles.has(val)) throw new Error(`Cannot assign multiple handles for ${TokenType[type]} -> '${val}'`)
				handles.set(val,handle)
				return this
			},
			fallback(handle:handle<T>) {
				if (self.fallbacks.has(type)) throw new Error('Cannot assign multiple fallbacks to same tokentype ('+TokenType[type]+')')
				self.fallbacks.set(type,handle)
				return this
			}
		}
	}

	fallback(handle:handle<T>) {
		if (this.finalFallback) throw new Error('cannot redeclare a final fallback')
		this.finalFallback = handle
		return this
	}

	consume(iter:TokenIterator,context:T) {
		for (let token of iter) {
			if (!this.handles.has(token.type)) {
				token.throwDebug(`SyntaxParse unassigned type (parser:${this.name})`)
			} else {
				let map = this.handles.get(token.type) as Map<string,handle<T>>
				if (!map.has(token.value)) {
					if (!this.fallbacks.has(token.type)) {
						if (this.finalFallback) this.finalFallback(iter,context)
						else token.throwDebug(`SyntaxParse unassigned fallback (parser:${this.name})`)
					} else if ((this.fallbacks.get(token.type) as handle<T>)(iter,context)) break
				} else {
					let handle = map.get(token.value) as handle<T>
					if (handle(iter,context)) break	
				}
			}
			if (iter.isDone()) break
		}
	}

}
