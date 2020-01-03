
import { Token } from "../lexing/Token"
import { Declaration } from "./Declaration"
import { Possible, ReturnWrapper } from "../toolbox/CompileErrors"

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

    getUnreferenced() {
        let ret: {[key:string]:Declaration} = {}
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

    getDeclaration(name:Token): Possible<Declaration>
    getDeclaration(name:string): Declaration|null
    getDeclaration(name:string|Token): Declaration|null|Possible<Declaration> {
        let err = new ReturnWrapper<Declaration>()
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

    declare(name:Token,decl:Declaration) {
        // check for reserved names here
        if (this.getDeclaration(name.value)) name.throwDebug('redefinition')
        this.declarations.set(name.value,{decl,refCounter:0})
        SymbolTable.allDeclarations.push(decl)
    }

}
