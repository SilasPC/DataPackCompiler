"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SymbolTable_1 = require("./SymbolTable");
const Instructions_1 = require("../codegen/Instructions");
const ESR_1 = require("./ESR");
class Scope {
    constructor(parent, symbols, name, ctx, breakerVar, returnVar, type) {
        this.parent = parent;
        this.symbols = symbols;
        this.name = name;
        this.ctx = ctx;
        this.breakerVar = breakerVar;
        this.returnVar = returnVar;
        this.type = type;
        this.stack = [this.instrBuffer = []];
    }
    static createRoot(name, ctx) {
        return new Scope(null, SymbolTable_1.SymbolTable.createRoot(), name, ctx, ctx.scoreboards.getStatic([name, 'break']), null, 'NONE');
    }
    /**
     * This will give the instructions needed to break
     * all scopes down to and including the scope specified.
     *
     * This also creates new flowbuffers for the scopes in question,
     * so further code in the scopes wont run after triggering these instructions
     */
    breakScopes(scope) {
        // maybe this should change
        let instr = {
            type: Instructions_1.InstrType.INT_OP,
            into: { type: ESR_1.ESRType.INT, const: false, tmp: false, mutable: false, scoreboard: this.breakerVar },
            from: { type: ESR_1.ESRType.INT, const: false, tmp: false, mutable: false, scoreboard: this.ctx.scoreboards.getConstant(1) },
            op: '='
        };
        this.newFlowBuffer();
        if (scope == this)
            return [instr];
        if (!this.parent)
            throw new Error('attempting to break beyond root scope');
        return [...this.parent.breakScopes(scope), instr];
    }
    getSuperByType(type) {
        if (this.type == type)
            return this;
        if (!this.parent)
            return null;
        return this.parent.getSuperByType(type);
    }
    getReturnVar() {
        return this.returnVar;
    }
    setReturnVar(esr) {
        if (this.returnVar)
            throw new Error('cannot overwrite scope return var');
        this.returnVar = esr;
    }
    newFlowBuffer() {
        // we don't new a new instr buffer if the last one hasn't been used
        if (this.instrBuffer.length)
            this.stack.push(this.instrBuffer = []);
    }
    mergeBuffers() {
        let out = [];
        // temporary merge function
        // we need to do some flow processing here
        // there is for now no 'if' check
        let fns = Array(this.stack.length - 1)
            .fill(0)
            .map(() => this.ctx.createFnFile([...this.getScopeNames(), 'controlflow']));
        return this.stack.slice(0, -1).reduceRight((body, con, i) => {
            let fn = fns[i];
            fn.add(...body);
            return con.concat({
                type: Instructions_1.InstrType.LOCAL_INVOKE,
                fn
            });
        }, this.instrBuffer);
    }
    push(...instrs) {
        this.instrBuffer.push(...instrs);
    }
    branch(newName, type, returnVar) {
        return new Scope(this, this.symbols.branch(), newName, this.ctx, this.ctx.scoreboards.getStatic([...this.getScopeNames(), newName, 'break']), returnVar, type);
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