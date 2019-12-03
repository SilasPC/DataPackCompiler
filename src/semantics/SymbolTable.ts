
import { Token } from "../lexing/Token"
import { Declaration } from "./Declaration"
import { ScoreboardManager } from "../toolbox/ScoreboardManager"
import { ASTLetNode } from "../syntax/AST"
import { ValueType, ElementaryValueType, ValueTypes } from "./Types"

const elementaryTypes: {[k:string]:ValueType} = {
    int: ValueTypes.ELEMENTARY(ElementaryValueType.INT),
    void: ValueTypes.ELEMENTARY(ElementaryValueType.VOID)
}

export class SymbolTable {

    private static allDeclarations: Declaration[] = []

    public static getAllDeclarations() {return this.allDeclarations}

    private readonly children: SymbolTable[] = []
    private readonly declarations: Map<string,Declaration> = new Map()

    constructor(
        public readonly parent: SymbolTable|null
    ) {}

    branch() {
        let child = new SymbolTable(this)
        this.children.push(child)
        return child
    }

    getDeclaration(name:string): Declaration|null {
        let decl = this.declarations.get(name)
        if (decl) return decl
        if (this.parent) return this.parent.getDeclaration(name)
        return null
    }

    declare(name:Token,decl:Declaration) {
        // check for reserved names here
        if (this.getDeclaration(name.value)) name.throwDebug('redefinition')
        this.declarations.set(name.value,decl)
        SymbolTable.allDeclarations.push(decl)
    }

}
