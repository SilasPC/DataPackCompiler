
import { Token } from "../lexing/Token"
import { Declaration } from "./Declaration"

export class SymbolTable {

    public static createRoot() {
        return new SymbolTable(null)
    }

    private static allDeclarations: Declaration[] = []

    public static getAllDeclarations() {return this.allDeclarations}

    private readonly children: SymbolTable[] = []
    private readonly declarations: Map<string,{decl:Declaration,refCounter:number}> = new Map()

    private constructor(
        public readonly parent: SymbolTable|null
    ) {}

    branch() {
        let child = new SymbolTable(this)
        this.children.push(child)
        return child
    }

    getDeclaration(name:Token): Declaration
    getDeclaration(name:string): Declaration|null
    getDeclaration(name:string|Token): Declaration|null
    getDeclaration(name:string|Token): Declaration|null {
        let id = (typeof name == 'string') ? name : name.value
        let decl = this.declarations.get(id)
        if (decl) {
            decl.refCounter++
            return decl.decl
        }
        if (this.parent) return this.parent.getDeclaration(name)
        if (name instanceof Token) name.throwDebug('not available in scope')
        return null
    }

    declare(name:Token,decl:Declaration) {
        // check for reserved names here
        if (this.getDeclaration(name.value)) name.throwDebug('redefinition')
        this.declarations.set(name.value,{decl,refCounter:0})
        SymbolTable.allDeclarations.push(decl)
    }

}
