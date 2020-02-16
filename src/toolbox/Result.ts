import { CompileError } from "./CompileErrors"

export class ResultWrapper<T,P> {

    private part: P | null = null
    private readonly errors = new Set<CompileError>()
    private readonly warnings = new Set<CompileError>()

    addError(err:CompileError) {this.errors.add(err)}
    addWarning(wrn:CompileError) {this.warnings.add(wrn)}

    getErrors() {return this.errors}
    hasErrors() {return this.errors.size > 0}
    getWarnings() {return this.warnings}
    hasWarnings() {return this.warnings.size > 0}

    mergeCheck(res:Result<any,any>|EnsuredResult<any>|EmptyResult): boolean {
        let resc = res as ResultClass<any,any>
        for (let err of resc.errors)
            this.errors.add(err)
        for (let wrn of resc.warnings)
            this.warnings.add(wrn)
        return resc.errors.length > 0
    }

    merge<K,S>(res:Result<K,S>): res is FailedResult<K,S> {
        let resc = res as ResultClass<K,S>
        for (let err of resc.errors)
            this.errors.add(err)
        for (let wrn of resc.warnings)
            this.warnings.add(wrn)
        return resc.errors.length > 0
    }

    partial(val:P) {
        this.part = val
    }

    wrap(val:T): Result<T,P> {
        return new ResultClass(
            'normal',
            [...this.errors], [...this.warnings],
            val, this.part
        ) as any
    }

    empty(): EmptyResult {
        return new ResultClass(
            'empty',
            [...this.errors], [...this.warnings],
            null, null
        ) as any
    }

    ensured(val:P): EnsuredResult<P> {
        return new ResultClass(
            'ensured',
            [...this.errors], [...this.warnings],
            null as any, val
        ) as any
    }

    none(): Result<T,P> {
        if (this.errors.size == 0) throw new Error('ResultWrapper.none() called without adding any errors')
        return new ResultClass(
            'normal',
            [...this.errors], [...this.warnings],
            null as any, this.part
        ) as any
    }

    pass(res:Result<T,P>): Result<T,P> {
        if (
            !this.merge(res) &&
            this.errors.size == 0
        ) return this.wrap(res.getValue())
        return this.none()
	}

}

export interface EnsuredResult<T> {
    readonly _type: 'ensured'
    getEnsured(): T
}

export interface EmptyResult {
    readonly _type: 'empty'
}

export type Result<T,P> = FailedResult<T,P> | SuccededResult<T,P>

export interface FailedResult<T,P> {
    readonly _type: 'normal'
    getValue(): null
    getPartial(): P | null
}

export interface SuccededResult<T,P> {
    readonly _type: 'normal'
    getValue(): T
    getPartial(): null
}

class ResultClass<T,P> {

    constructor(
        public readonly _type: 'normal' | 'ensured' |'empty',
        public readonly errors: readonly CompileError[],
        public readonly warnings: readonly CompileError[],
        private readonly full:T,
        private readonly part:P|null
    ) {}

    getPartial(): P | null {
        if (this.errors.length == 0) return null
        return this.part
    }

    getValue(): T | null {
        if (this.errors.length == 0) return this.full
        return null
    }

    getEnsured(): P {
        if (this.part == null) throw new Error('ensured had no partial value')
        return this.part
    }

}
