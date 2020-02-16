
import { DeclarationWrapper, Declaration } from "../declarations/Declaration"
import { Logger } from "../../toolbox/Logger"
import { TokenI } from "../../lexing/Token"
import $ from 'js-itertools'
import { Result, ResultWrapper, EmptyResult } from "../../toolbox/Result"

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

    evaluate(log: Logger): Result<DeclarationWrapper,null> {
        const result = new ResultWrapper<DeclarationWrapper,null>()
        this.refCounter++
        if (this.failed) return result.none()
        if (this.active) {
            log.addError(this.token.error('circular dependency'))
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
    addHoister(token:TokenI, fn:HoisterFn): Hoister
    addPrehoisted(token: TokenI, decl: DeclarationWrapper): Hoister
    addPreHoistedInvalid(token:TokenI): Hoister
}

export class HoistingMaster implements UnreadableHoistingMaster {

    private defered = new Set<()=>EmptyResult>()
    defer(fn:()=>EmptyResult) {this.defered.add(fn)}

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
            .filter(h=>!h.wasReferenced())
    }

    flushAll(log: Logger) {
        const result = new ResultWrapper()
        result.merge(this.flushDefered())
        for (let h of this.hoisters)
            result.merge(h.evaluate(log))
        return result.wrap(true)
    }

    flushDefered() {
        const result = new ResultWrapper()
        for (let fn of this.defered)
            result.mergeCheck(fn())
        this.defered.clear()
        return result.wrap(true)
    }

}
