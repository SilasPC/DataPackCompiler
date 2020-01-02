"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
const CompileErrors_1 = require("../toolbox/CompileErrors");
class SymbolTable {
    constructor(parent) {
        this.parent = parent;
        this.children = [];
        this.declarations = new Map();
    }
    static createRoot() {
        return new SymbolTable(null);
    }
    static getAllDeclarations() { return this.allDeclarations; }
    branch() {
        let child = new SymbolTable(this);
        this.children.push(child);
        return child;
    }
    getDeclaration(name) {
        let err = new CompileErrors_1.CompileErrorSet();
        let id = (typeof name == 'string') ? name : name.value;
        let decl = this.declarations.get(id);
        if (decl) {
            decl.refCounter++;
            if (name instanceof Token_1.Token)
                return err.wrap(decl.decl);
            return decl.decl;
        }
        if (this.parent) {
            // TypeScript needs explicit overload seperation here :/
            if (name instanceof Token_1.Token)
                return this.parent.getDeclaration(name);
            return this.parent.getDeclaration(name);
        }
        if (name instanceof Token_1.Token) {
            let err = new CompileErrors_1.CompileErrorSet(name.error(`'${name.value}' not available in scope`));
            return err.wrap();
        }
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