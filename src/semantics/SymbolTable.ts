
import { TokenI, Token } from "../lexing/Token"
import { DeclarationWrapper } from "./Declaration"
import { Possible, ReturnWrapper } from "../toolbox/CompileErrors"

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

    getDeclaration(name:TokenI): Possible<DeclarationWrapper>
    getDeclaration(name:string): DeclarationWrapper|null
    getDeclaration(name:string|TokenI): DeclarationWrapper|null|Possible<DeclarationWrapper> {
        let err = new ReturnWrapper<DeclarationWrapper>()
        let id = (typeof name == 'string') ? name : name.value
        let decl = this.declarations.get(id)
        if (decl) {
            decl.refCounter++
            if (name instanceof Token) return err.wrap(decl.decl)
            return decl.decl
        }
        if (this.parent) {
            // TypeScript needs explicit overload seperation here :/
            if (name instanceof Token) return this.parent.getDeclaration(name)
            return this.parent.getDeclaration(name)
        }
        if (name instanceof Token)
            return err.wrap(name.error(`'${name.value}' not available in scope`))
        return null
    }

    declare(decl:DeclarationWrapper) {
        // check for reserved names here
        if (this.getDeclaration(decl.token.value)) decl.token.throwDebug('redefinition')
        this.declarations.set(decl.token.value,{decl,refCounter:0})
    }

}
