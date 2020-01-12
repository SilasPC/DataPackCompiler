
import { TokenI } from "../lexing/Token"
import { DeclarationWrapper, Declaration } from "./Declaration"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { CompileContext } from "../toolbox/CompileContext"
import $ from 'js-itertools'

export type Hoister = (earlyReplace:(decl:Declaration)=>void) => Maybe<Declaration>

type InternalWrapper = {
    decl: DeclarationWrapper | null
    token: TokenI
    hoister: Hoister
    refCounter: number
    failed: boolean
    active: boolean
    hoisted: boolean
}

export class SymbolTable {

    public static createRoot() {
        return new SymbolTable(null)
    }

    private readonly declarations: Map<string,InternalWrapper> = new Map()

    private readonly children: SymbolTable[] = []

    private constructor(
        public readonly parent: SymbolTable|null
    ) {}

    /** Only returns for local scope */
    getUnreferenced() {
        return $(this.declarations)
            .filter(([_,w])=>!w.refCounter)
            .map(([k,w])=>[k,w.decl] as [string,DeclarationWrapper])
    }

    branch() {
        let child = new SymbolTable(this)
        this.children.push(child)
        return child
    }

    private getInternal(id:string): InternalWrapper | null {
        if (this.declarations.has(id)) return this.declarations.get(id) as InternalWrapper
        if (this.parent) return this.parent.getInternal(id)
        return null
    }

    getDeclaration(name:TokenI,ctx:CompileContext): Maybe<DeclarationWrapper> {
        let maybe = new MaybeWrapper<DeclarationWrapper>()
        let iw = this.getInternal(name.value)
        if (!iw) {
            ctx.addError(name.error(`'${name.value}' not available in scope`))
            return maybe.none()
        }
        iw.refCounter++
        if (iw.failed) return maybe.none()
        if (iw.active) {
            ctx.addError(name.error('circular dependency'))
            return maybe.none()
        }
        if (iw.decl) return maybe.wrap(iw.decl)

        let wrapper = this.callHoister(iw)
        if (wrapper) return maybe.wrap(wrapper)
        return maybe.none()
    }

    private callHoister(iw:InternalWrapper): DeclarationWrapper | null {

        // fail fast on a potentially nasty bug...
        if (iw.hoisted) throw new Error('declaration already hoisted')

        iw.active = true
        let decl = iw.hoister(decl=>{
            iw.decl = {decl,token:iw.token}
        })
        iw.hoisted = true
        iw.active = false

        if (decl.value) {
            if (iw.decl) {
                if (iw.decl.decl != decl.value)
                    throw new Error('early replaced different declaration '+iw.token.value)
            } else iw.decl = {
                decl: decl.value,
                token: iw.token
            }
            iw.refCounter++
            return iw.decl
        }

        iw.failed = true

        return null

    }

    declareDirect(id:TokenI,decl:Declaration,ctx:CompileContext): Maybe<true> {
        const maybe = new MaybeWrapper<true>()
        if (this.getInternal(id.value)) {
            ctx.addError(id.error('duplicate declaration'))
            return maybe.none()
        }
        let iw: InternalWrapper = {
            decl: {token:id,decl},
            token: id,
            refCounter: 0,
            hoister: ()=>{throw new Error('no hoister')},
            failed: false,
            active: false,
            hoisted: false
        }
        this.declarations.set(id.value,iw)
        return maybe.wrap(true)
    }

    declareHoister(id:TokenI,hoister:Hoister,ctx:CompileContext): Maybe<true> {
        const maybe = new MaybeWrapper<true>()
        let iw: InternalWrapper = {
            decl: null,
            token: id,
            hoister,
            refCounter: 0,
            failed: false,
            active: false,
            hoisted: false
        }
        if (this.getInternal(id.value)) {
            ctx.addError(id.error('duplicate declaration'))
            this.callHoister(iw)
            return maybe.none()
        }
        this.declarations.set(id.value,iw)
        return maybe.wrap(true)
    }

    flushHoisters(): Maybe<true> {
        const maybe = new MaybeWrapper<true>()
        for (let [id,iw] of this.declarations) {
            if (iw.hoisted) continue
            if (this.callHoister(iw)) continue
            maybe.noWrap()
        }
        return maybe.wrap(true)
    }

    /*declareDirect(decl:DeclarationWrapper,ctx:CompileContext): Maybe<true> {
        const maybe = new MaybeWrapper<true>()
        // check for reserved names here
        if (
            keywords.includes(decl.token.value) ||
            types.includes(decl.token.value)
        ) {
            ctx.addError(decl.token.error('cannot declare reserved/keyword'))
            return maybe.none()
        }
        if (this.getDeclaration(decl.token,ctx)) {
            ctx.addError(decl.token.error('redefinition'))
            return maybe.none()
        }
        this.declarations.set(decl.token.value,{decl,refCounter:0})
        return maybe.wrap(true)
    }*/

}
