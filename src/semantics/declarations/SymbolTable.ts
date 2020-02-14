
import { TokenI } from "../../lexing/Token"
import { DeclarationWrapper, Declaration } from "./Declaration"
import { Maybe, MaybeWrapper } from "../../toolbox/Maybe"
import { reservedSymbols } from "../../lexing/values"
import { Logger } from "../../toolbox/Logger"
import { HoistingMaster, HoisterI, HoisterFn, UnreadableHoistingMaster } from "../managers/HoistingMaster"

// Change to PublicSymbolTable (use a pubGet method for getting public members)
export interface ReadOnlySymbolTable {
    getDeclaration(name:TokenI,log:Logger): Maybe<DeclarationWrapper>
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

    getDeclaration(name:TokenI,log:Logger): Maybe<DeclarationWrapper> {
        let maybe = new MaybeWrapper<DeclarationWrapper>()
        let hoister = this.getInternal(name.value)
        if (!hoister) {
            log.addError(name.error(`'${name.value}' not available in scope`))
            return maybe.none()
        }
        return maybe.pass(hoister.evaluate(log))
    }

    declareInvalidDirect(id:TokenI,log:Logger): Maybe<true> {
        const maybe = new MaybeWrapper<true>()
        if (reservedSymbols.includes(id.value)) {
            log.addError(id.error('reserved identifier'))
            return maybe.none()
        }
        if (this.getInternal(id.value)) {
            log.addError(id.error('duplicate declaration'))
            return maybe.none()
        }
        this.declarations.set(id.value,this.master.addPreHoistedInvalid(id))
        return maybe.wrap(true)
    }

    declareDirect(id:TokenI,decl:Declaration,log:Logger): Maybe<true> {
        const maybe = new MaybeWrapper<true>()
        if (reservedSymbols.includes(id.value)) {
            log.addError(id.error('reserved identifier'))
            return maybe.none()
        }
        if (this.getInternal(id.value)) {
            log.addError(id.error('duplicate declaration'))
            return maybe.none()
        }
        this.declarations.set(id.value,this.master.addPrehoisted(id,{decl,token:id}))
        return maybe.wrap(true)
    }

    declareHoister(id:TokenI,hoister:HoisterFn,log:Logger): Maybe<true> {
        const maybe = new MaybeWrapper<true>()
        if (reservedSymbols.includes(id.value)) {
            log.addError(id.error('reserved identifier'))
            return maybe.none()
        }
        this.declarations.set(id.value,this.master.addHoister(id,hoister))
        return maybe.wrap(true)
    }

}
