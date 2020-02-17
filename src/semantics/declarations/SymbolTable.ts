
import { TokenI } from "../../lexing/Token"
import { Declaration } from "./Declaration"
import { reservedSymbols } from "../../lexing/values"
import { HoisterI, HoisterFn, UnreadableHoistingMaster } from "../managers/HoistingMaster"
import { Result, ResultWrapper, EmptyResult } from "../../toolbox/Result"

class HoisterWrapper {

    public static fromHoister(v:HoisterI) {
        return new HoisterWrapper({h:true,v})
    }

    public static fromDeclaration(v:Declaration) {
        return new HoisterWrapper({h:false,v})
    }

    public static fromNothing() {
        return new HoisterWrapper(null)
    }

    private constructor(
        private readonly value: {h:true,v:HoisterI}|{h:false,v:Declaration} | null
    ) {}

    public evaluate(): Result<Declaration,null> {
        const result = new ResultWrapper<Declaration,null>()
        if (!this.value) return result.noneNoErrors()
        if (this.value.h) return result.pass(this.value.v.evaluate())
        return result.wrap(this.value.v)
    }

}

// Change to PublicSymbolTable (use a pubGet method for getting public members)
export interface ReadOnlySymbolTable {
    getDeclaration(name:TokenI): Result<Declaration,null>
}

export class SymbolTable implements ReadOnlySymbolTable {

    public static createRoot(master: UnreadableHoistingMaster) {
        return new SymbolTable(master,null)
    }

    protected readonly declarations: Map<string,HoisterWrapper> = new Map()

    private readonly children: SymbolTable[] = []

    protected constructor(
        public readonly master: UnreadableHoistingMaster,
        public readonly parent: SymbolTable|null
    ) {}

    branch() {
        let child = new SymbolTable(this.master, this)
        this.children.push(child)
        return child
    }

    private getInternal(id:string): HoisterWrapper | null {
        if (this.declarations.has(id)) return this.declarations.get(id) as HoisterWrapper
        if (this.parent) return this.parent.getInternal(id)
        return null
    }

    hasDeclaration(name:string) {
        return this.getInternal(name) != null
    }

    getDeclaration(name:TokenI): Result<Declaration,null> {
        let result = new ResultWrapper<Declaration,null>()
        let hoister = this.getInternal(name.value)
        if (!hoister) {
            result.addError(name.error(`'${name.value}' not available in scope`))
            return result.none()
        }
        return result.pass(hoister.evaluate())
    }

    declareUnsafe(name:string,decl:Declaration) {
        if (this.declarations.has(name)) throw new Error('unsafe redeclaration')
        this.declarations.set(name,HoisterWrapper.fromDeclaration(decl))
    }

    declareFailed(id:TokenI): EmptyResult {
        const result = new ResultWrapper()
        if (reservedSymbols.includes(id.value)) {
            result.addError(id.error('reserved identifier'))
            return result.empty()
        }
        if (this.getInternal(id.value)) {
            result.addError(id.error('duplicate declaration'))
            return result.empty()
        }
        this.declarations.set(id.value,HoisterWrapper.fromNothing())
        return result.empty()
    }

    declareDirect(id:TokenI,decl:Declaration): EmptyResult {
        const result = new ResultWrapper()
        if (reservedSymbols.includes(id.value)) {
            result.addError(id.error('reserved identifier'))
            return result.empty()
        }
        if (this.getInternal(id.value)) {
            result.addError(id.error('duplicate declaration'))
            return result.empty()
        }
        this.declarations.set(id.value,HoisterWrapper.fromDeclaration(decl))
        return result.empty()
    }

    deferHoister(id:TokenI,hoister:HoisterFn): EmptyResult {
        const result = new ResultWrapper()
        let h = this.master.deferHoister(id,hoister)
        if (reservedSymbols.includes(id.value)) {
            result.addError(id.error('reserved identifier'))
            return result.empty()
        }
        if (this.getInternal(id.value)) {
            result.addError(id.error('duplicate declaration'))
            return result.empty()
        }
        this.declarations.set(id.value,HoisterWrapper.fromHoister(h))
        return result.empty()
    }

    declareHoister(id:TokenI,hoister:HoisterFn): EmptyResult {
        const result = new ResultWrapper()
        let h = this.master.addHoister(id,hoister)
        if (reservedSymbols.includes(id.value)) {
            result.addError(id.error('reserved identifier'))
            return result.empty()
        }
        if (this.getInternal(id.value)) {
            result.addError(id.error('duplicate declaration'))
            return result.empty()
        }
        this.declarations.set(id.value,HoisterWrapper.fromHoister(h))
        return result.empty()
    }

}
