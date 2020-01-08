
import { TokenI, Token } from "../lexing/Token"
import { DeclarationWrapper } from "./Declaration"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { CompileContext } from "../toolbox/CompileContext"

export class SymbolTable {

    public static createRoot() {
        return new SymbolTable(null)
    }

    private readonly children: SymbolTable[] = []
    private readonly declarations: Map<string,{decl:DeclarationWrapper,refCounter:number}> = new Map()

    private constructor(
        public readonly parent: SymbolTable|null
    ) {}

    getUnreferenced() {
        let ret: {[key:string]:DeclarationWrapper} = {}
        for (let [key,decl] of this.declarations.entries()) {
            if (decl.refCounter == 0) ret[key] = decl.decl
        }
        return ret
    }

    branch() {
        let child = new SymbolTable(this)
        this.children.push(child)
        return child
    }

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
            if (!ctx) throw new Error('overload not matched')
            ctx.addError(name.error(`'${name.value}' not available in scope`))
            return maybe.none()
        }
        if (decl) return decl.decl
        return null
    }

    declare(decl:DeclarationWrapper) {
        // check for reserved names here
        if (this.getDeclaration(decl.token.value)) decl.token.throwDebug('redefinition')
        this.declarations.set(decl.token.value,{decl,refCounter:0})
    }

}
