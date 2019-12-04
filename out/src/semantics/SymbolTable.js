"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
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
        let id = (typeof name == 'string') ? name : name.value;
        let decl = this.declarations.get(id);
        if (decl) {
            decl.refCounter++;
            return decl.decl;
        }
        if (this.parent)
            return this.parent.getDeclaration(name);
        if (name instanceof Token_1.Token)
            name.throwDebug('not available in scope');
        return null;
    }
    declare(name, decl) {
        // check for reserved names here
        if (this.getDeclaration(name.value))
            name.throwDebug('redefinition');
        this.declarations.set(name.value, { decl, refCounter: 0 });
        SymbolTable.allDeclarations.push(decl);
    }
}
SymbolTable.allDeclarations = [];
exports.SymbolTable = SymbolTable;
//# sourceMappingURL=SymbolTable.js.map