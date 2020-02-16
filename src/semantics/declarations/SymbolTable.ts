
import { TokenI } from "../../lexing/Token"
import { DeclarationWrapper, Declaration } from "./Declaration"
import { reservedSymbols } from "../../lexing/values"
import { Logger } from "../../toolbox/Logger"
import { HoisterI, HoisterFn, UnreadableHoistingMaster } from "../managers/HoistingMaster"
import { Result, ResultWrapper, EmptyResult } from "../../toolbox/Result"

// Change to PublicSymbolTable (use a pubGet method for getting public members)
export interface ReadOnlySymbolTable {
    getDeclaration(name:TokenI,log:Logger): Result<DeclarationWrapper,null>
}

export class SymbolTable implements ReadOnlySymbolTable {

    public static createRoot(master: UnreadableHoistingMaster) {
        return new SymbolTable(master,null)
    }

    protected readonly declarations: Map<string,HoisterI> = new Map()

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

    private getInternal(id:string): HoisterI | null {
        if (this.declarations.has(id)) return this.declarations.get(id) as HoisterI
        if (this.parent) return this.parent.getInternal(id)
        return null
    }

    hasDeclaration(name:string) {
        return this.getInternal(name) != null
    }

    getDeclaration(name:TokenI,log:Logger): Result<DeclarationWrapper,null> {
        let result = new ResultWrapper<DeclarationWrapper,null>()
        let hoister = this.getInternal(name.value)
        if (!hoister) {
            log.addError(name.error(`'${name.value}' not available in scope`))
            return result.none()
        }
        return result.pass(hoister.evaluate(log))
    }

    declareInvalidDirect(id:TokenI,log:Logger): EmptyResult {
        const maybe = new ResultWrapper()
        if (reservedSymbols.includes(id.value)) {
            log.addError(id.error('reserved identifier'))
            return maybe.empty()
        }
        if (this.getInternal(id.value)) {
            log.addError(id.error('duplicate declaration'))
            return maybe.empty()
        }
        this.declarations.set(id.value,this.master.addPreHoistedInvalid(id))
        return maybe.empty()
    }

    declareDirect(id:TokenI,decl:Declaration,log:Logger): EmptyResult {
        const maybe = new ResultWrapper()
        if (reservedSymbols.includes(id.value)) {
            log.addError(id.error('reserved identifier'))
            return maybe.empty()
        }
        if (this.getInternal(id.value)) {
            log.addError(id.error('duplicate declaration'))
            return maybe.empty()
        }
        this.declarations.set(id.value,this.master.addPrehoisted(id,{decl,token:id}))
        return maybe.empty()
    }

    declareHoister(id:TokenI,hoister:HoisterFn,log:Logger): EmptyResult {
        const maybe = new ResultWrapper()
        if (reservedSymbols.includes(id.value)) {
            log.addError(id.error('reserved identifier'))
            return maybe.empty()
        }
        this.declarations.set(id.value,this.master.addHoister(id,hoister))
        return maybe.empty()
    }

}
