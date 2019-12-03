"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SymbolTable {
    constructor(parent) {
        this.parent = parent;
        this.children = [];
        this.declarations = new Map();
    }
    static getAllDeclarations() { return this.allDeclarations; }
    branch() {
        let child = new SymbolTable(this);
        this.children.push(child);
        return child;
    }
    getDeclaration(name) {
        let decl = this.declarations.get(name);
        if (decl)
            return decl;
        if (this.parent)
            return this.parent.getDeclaration(name);
        return null;
    }
    declare(name, decl) {
        if (this.getDeclaration(name.value))
            name.throwDebug('redefinition');
        this.declarations.set(name.value, decl);
        SymbolTable.allDeclarations.push(decl);
    }
}
SymbolTable.allDeclarations = [];
exports.SymbolTable = SymbolTable;
//# sourceMappingURL=SymbolTable.js.map