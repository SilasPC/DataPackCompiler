
import { TokenI, Token } from "../lexing/Token"
import { DeclarationWrapper } from "./Declaration"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { CompileContext } from "../toolbox/CompileContext"
import { keywords, types } from "../lexing/values"
import $ from 'js-itertools'

export class SymbolTableLike {

    protected readonly declarations: Map<string,{decl:DeclarationWrapper,refCounter:number}> = new Map()

    getDeclaration(name:TokenI): DeclarationWrapper|null {
        let decl = this.declarations.get(name.value)
        if (decl) {
            decl.refCounter++
            return decl.decl
        }
        return null
    }

}


export class SymbolTable extends SymbolTableLike {

    public static createRoot() {
        return new SymbolTable(null)
    }

    private readonly children: SymbolTable[] = []

    private constructor(
        public readonly parent: SymbolTable|null
    ) {super()}

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

    getDeclaration(name:TokenI): DeclarationWrapper|null
    getDeclaration(name:TokenI,ctx:CompileContext): Maybe<DeclarationWrapper>
    getDeclaration(name:string): DeclarationWrapper|null
    getDeclaration(name:string|TokenI,ctx?:CompileContext): DeclarationWrapper|null|Maybe<DeclarationWrapper> {
        let maybe = new MaybeWrapper<DeclarationWrapper>()
        let id = (typeof name == 'string') ? name : name.value
        let decl = this.declarations.get(id)
        if (decl) decl.refCounter++
        else if (this.parent) return this.parent.getDeclaration(name as any,ctx as any)
        if (name instanceof Token) {
            if (decl) return maybe.wrap(decl.decl)
            if (!ctx) return null
            ctx.addError(name.error(`'${name.value}' not available in scope`))
            return maybe.none()
        }
        if (decl) return decl.decl
        return null
    }

    declare(decl:DeclarationWrapper,ctx:CompileContext): Maybe<true> {
        const maybe = new MaybeWrapper<true>()
        // check for reserved names here
        if (
            keywords.includes(decl.token.value) ||
            types.includes(decl.token.value)
        ) {
            ctx.addError(decl.token.error('cannot declare reserved/keyword'))
            return maybe.none()
        }
        if (this.getDeclaration(decl.token)) {
            ctx.addError(decl.token.error('redefinition'))
            return maybe.none()
        }
        this.declarations.set(decl.token.value,{decl,refCounter:0})
        return maybe.wrap(true)
    }

}
