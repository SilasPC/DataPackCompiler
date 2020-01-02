"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CompileErrorSet extends Error {
    constructor(...errors) {
        super('Compilation error');
        this.errors = [];
        this.errors.push(...errors);
    }
    getErrors() { return this.errors; }
    hasError() { return true; }
    hasValue() { return false; }
    isEmpty() {
        return this.errors.length == 0;
    }
    getCount() {
        return this.errors.length;
    }
    merge(set) {
        this.errors.push(...set.errors);
        return this;
    }
    /**
     * Type guard for possible having a value.
     * If not, errors are merged into this
     */
    checkHasValue(pos) {
        if (pos.hasError()) {
            this.merge(pos);
            return false;
        }
        if (!pos.hasValue())
            throw new Error('possible must have value or error');
        return true;
    }
    push(...errors) {
        this.errors.push(...errors);
        return this;
    }
    wrap(val) {
        if (typeof val == 'undefined')
            return this;
        if (isPossible(val)) {
            if (val.hasError())
                return this.merge(val);
            return val;
        }
        if (!this.isEmpty())
            return this;
        return new DefinitePossible(val);
    }
}
exports.CompileErrorSet = CompileErrorSet;
function isPossible(val) {
    return (val instanceof DefinitePossible ||
        val instanceof CompileErrorSet);
}
class DefinitePossible {
    constructor(value) {
        this.value = value;
    }
    hasError() { return false; }
    hasValue() { return true; }
}
class CompileError extends Error {
    constructor(
    /*public readonly pfile: ParsingFile,
    public readonly indexStart: number,
    public readonly indexEnd: number,
    public readonly msg: string*/
    errorString) {
        super('Compilation error');
        this.errorString = errorString;
    }
    getErrorString() {
        return this.errorString;
    }
}
exports.CompileError = CompileError;
//# sourceMappingURL=CompileErrors.js.map