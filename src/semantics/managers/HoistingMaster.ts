
import { DeclarationWrapper, Declaration } from "../declarations/Declaration"
import { Logger } from "../../toolbox/Logger"
import { TokenI } from "../../lexing/Token"
import $ from 'js-itertools'
import { Result, ResultWrapper, EmptyResult, EnsuredResult } from "../../toolbox/Result"

export type HoisterFn = () => Result<Declaration,null>

export interface HoisterI extends Hoister {}

class Hoister {

    public static invalidUnhoisted(token: TokenI) {
        let h = new Hoister(()=>{throw new Error('no hoister')},token)
        h.hoisted = true
        h.failed = true
        return h
    }

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

    evaluate(): Result<DeclarationWrapper,null> {
        const result = new ResultWrapper<DeclarationWrapper,null>()
        this.refCounter++
        if (this.failed) return result.none()
        if (this.active) {
            result.addError(this.token.error('circular dependency'))
            return result.none()
        }
        if (this.decl) return result.wrap(this.decl)

        if (this.hoisted) throw new Error('already hoisted')

        this.active = true

        let decl = this.hoister()

        this.hoisted = true
        this.active = false

        if (!result.merge(decl)) {
            this.decl = {
                decl: decl.getValue(),
                token: this.token
            }
            return result.wrap(this.decl)
        }

        this.failed = true

        return result.none()

    }

}

export interface UnreadableHoistingMaster {
    defer(fn:()=>EmptyResult): void
    deferHoister(token:TokenI, fn: HoisterFn): Hoister
    addHoister(token:TokenI, fn:HoisterFn): Hoister
    addPrehoisted(token: TokenI, decl: DeclarationWrapper): Hoister
    addPreHoistedInvalid(token:TokenI): Hoister
}

export type DeferedFn = () => EmptyResult|EnsuredResult<any>|Result<any,any>

export class HoistingMaster implements UnreadableHoistingMaster {

    private defered = new Set<DeferedFn>()
    private deferedHoisters = new Set<Hoister>()
    defer(fn:DeferedFn) {this.defered.add(fn)}

    deferHoister(token:TokenI, fn:HoisterFn) {
        let h = new Hoister(fn, token)
        this.hoisters.add(h)
        this.deferedHoisters.add(h)
        return h
    }

    private hoisters = new Set<Hoister>()
    addHoister(token:TokenI, fn:HoisterFn) {
        let h = new Hoister(fn, token)
        this.hoisters.add(h)
        return h
    }

    addPreHoistedInvalid(token:TokenI) {
        let h = Hoister.invalidUnhoisted(token)
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
            .filter((h:Hoister)=>!h.wasReferenced())
    }

    flushAll(): EmptyResult {
        const result = new ResultWrapper()
        result.mergeCheck(this.flushDefered())
        for (let h of this.hoisters)
            result.merge(h.evaluate())
        return result.empty()
    }

    flushDefered(): EmptyResult {
        const result = new ResultWrapper()
        for (let fn of this.defered)
            result.mergeCheck(fn())
        for (let h of this.deferedHoisters)
            h.evaluate()
        this.deferedHoisters.clear()
        this.defered.clear()
        return result.empty()
    }

}
