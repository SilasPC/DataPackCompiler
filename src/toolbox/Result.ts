import { CompileError } from "./CompileErrors"

export class ResultWrapper<T,P> {

    private part: P | null = null
    private readonly errors = new Set<CompileError>()
    private readonly warnings = new Set<CompileError>()

    merge<K,S>(res:Result<any,any>): res is FailedResult<K,S> {
        let resc = res as ResultClass<any,any>
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
            [...this.errors], [...this.warnings],
            val, this.part
        ) as any
    }

    none(): Result<T,P> {
        return new ResultClass(
            [...this.errors], [...this.warnings],
            null as any, this.part
        )
    }

    pass(res:Result<T,P>): Result<T,P> {
        if (
            !this.merge(res) &&
            this.errors.size == 0
        ) return this.wrap(res.getValue())
        return this.none()
	}

}

export type Result<T,P> = FailedResult<T,P> | SuccededResult<T,P>

export interface FailedResult<T,P> extends ResultClass<T,P> {
    getValue(): null
    getPartial(): P | null
}

export interface SuccededResult<T,P> extends ResultClass<T,P> {
    getValue(): T
    getPartial(): null
}

class ResultClass<T,P> {

    constructor(
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

}
