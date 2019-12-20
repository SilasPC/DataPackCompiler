"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SymbolTable_1 = require("./SymbolTable");
class Scope {
    constructor(parent, symbols, name) {
        this.parent = parent;
        this.symbols = symbols;
        this.name = name;
    }
    static createRoot(name) {
        return new Scope(null, SymbolTable_1.SymbolTable.createRoot(), name);
    }
    branch(newName) {
        return new Scope(this, this.symbols.branch(), newName);
    }
    getScopeNames() {
        let names = [this.name];
        if (this.parent)
            names = this.parent.getScopeNames().concat(names);
        return names;
    }
}
exports.Scope = Scope;
//# sourceMappingURL=Scope.js.map