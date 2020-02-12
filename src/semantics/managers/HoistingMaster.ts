import { MaybeWrapper, Maybe } from "../../toolbox/Maybe"
import { DeclarationWrapper, Declaration } from "../declarations/Declaration"
import { log } from "console"
import { Logger } from "../../toolbox/Logger"
import { TokenI } from "../../lexing/Token"
import $ from 'js-itertools'

export type HoisterFn = () => Maybe<Declaration>

export interface HoisterI extends Hoister {}

class Hoister {

    public static unhoisted(token: TokenI, decl: DeclarationWrapper) {
        let h = new Hoister(()=>{throw new Error('no hoister')},token)
        h.decl = decl
        h.hoisted = true
        return h
    }

    private decl?: DeclarationWrapper
    
    private refCounter = 0

    private failed = false
    private active = false
    private hoisted = false

    constructor (
        private hoister: HoisterFn,
        private token: TokenI
    ) {}
    
    wasReferenced() {return this.refCounter > 0}

    evaluate(log: Logger): Maybe<DeclarationWrapper> {
        const maybe = new MaybeWrapper<DeclarationWrapper>()
        this.refCounter++
        if (this.failed) return maybe.none()
        if (this.active) {
            log.addError(this.token.error('circular dependency'))
            return maybe.none()
        }
        if (this.decl) return maybe.wrap(this.decl)

        if (this.hoisted) throw new Error('already hoisted')

        this.active = true

        let decl = this.hoister()

        this.hoisted = true
        this.active = false

        if (decl.value) {
            this.decl = {
                decl: decl.value,
                token: this.token
            }
            return maybe.wrap(this.decl)
        }

        this.failed = true

        return maybe.none()

    }

}

export interface UnreadableHoistingMaster {
    defer(fn:()=>Maybe<true>): void
    addHoister(token:TokenI, fn:HoisterFn): Hoister
    addPrehoisted(token: TokenI, decl: DeclarationWrapper): Hoister
}

export class HoistingMaster implements UnreadableHoistingMaster {

    private defered = new Set<()=>Maybe<true>>()
    defer(fn:()=>Maybe<true>) {this.defered.add(fn)}

    private hoisters = new Set<Hoister>()
    addHoister(token:TokenI, fn:HoisterFn) {
        let h = new Hoister(fn, token)
        this.hoisters.add(h)
        return h
    }

    addPrehoisted(token: TokenI, decl: DeclarationWrapper) {
        let h = Hoister.unhoisted(token,decl)
        this.hoisters.add(h)
        return h
    }

    getUnreferenced() {
        return $(this.hoisters)
            .filter(h=>!h.wasReferenced())
    }

    flushAll(log: Logger) {
        const maybe = new MaybeWrapper<true>()
        maybe.merge(this.flushDefered())
        for (let h of this.hoisters)
            maybe.merge(h.evaluate(log))
        return maybe.wrap(true)
    }

    flushDefered() {
        const maybe = new MaybeWrapper<true>()
        for (let fn of this.defered)
            maybe.merge(fn())
        this.defered.clear()
        return maybe.wrap(true)
    }

}
