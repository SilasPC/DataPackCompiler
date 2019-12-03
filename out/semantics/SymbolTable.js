"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Types_1 = require("./Types");
const elementaryTypes = {
    int: Types_1.ValueTypes.ELEMENTARY(Types_1.ElementaryValueType.INT),
    void: Types_1.ValueTypes.ELEMENTARY(Types_1.ElementaryValueType.VOID)
};
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
        // check for reserved names here
        if (this.getDeclaration(name.value))
            name.throwDebug('redefinition');
        this.declarations.set(name.value, decl);
        SymbolTable.allDeclarations.push(decl);
    }
}
SymbolTable.allDeclarations = [];
exports.SymbolTable = SymbolTable;
//# sourceMappingURL=SymbolTable.js.map