"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Base {
    constructor(wrapper, valueExists) {
        this.wrapper = wrapper;
        this.valueExists = valueExists;
    }
    hasError() { return !this.valueExists; }
    hasValue() { return this.valueExists; }
}
class DefinitePossible extends Base {
    constructor(wrapper, value) {
        super(wrapper, true);
        this.value = value;
        this.valueExists = true;
        if (wrapper.hasErrors())
            throw new Error('instantiated possible with value and error');
    }
}
class NotPossible extends Base {
    constructor(wrapper) {
        super(wrapper, false);
        this.valueExists = false;
        this.value = undefined;
        if (!wrapper.hasErrors())
            throw new Error('instantiated not possible with no errors');
    }
}
class ReturnWrapper {
    constructor() {
        this.errors = new Set();
        this.warnings = new Set();
    }
    getErrors() { return this.errors; }
    getWarnings() { return this.warnings; }
    hasWarnings() { return this.warnings.size > 0; }
    hasErrors() { return this.errors.size > 0; }
    getErrorCount() { return this.errors.size; }
    getWarningCount() { return this.warnings.size; }
    merge(arg) {
        let val = arg instanceof ReturnWrapper ? arg : arg.wrapper;
        for (let err of val.errors)
            this.errors.add(err);
        for (let err of val.warnings)
            this.warnings.add(err);
        if (arg instanceof Base)
            return arg.hasError();
    }
    push(error) {
        if (error.warnOnly)
            this.warnings.add(error);
        else
            this.errors.add(error);
        return this;
    }
    wrap(val) {
        if (val instanceof Base) {
            if (val.hasValue())
                return val;
            for (let err of val.wrapper.errors)
                this.errors.add(err);
            for (let err of val.wrapper.warnings)
                this.warnings.add(err);
            return new NotPossible(this);
        }
        if (val instanceof CompileError) {
            this.push(val);
            return new NotPossible(this);
        }
        if (this.hasErrors())
            return new NotPossible(this);
        return new DefinitePossible(this, val);
    }
}
exports.ReturnWrapper = ReturnWrapper;
class CompileError extends Error {
    constructor(
    /*public readonly pfile: ParsingFile,
    public readonly indexStart: number,
    public readonly indexEnd: number,
    public readonly msg: string*/
    errorString, warnOnly) {
        super('Compilation error');
        this.errorString = errorString;
        this.warnOnly = warnOnly;
    }
    getErrorString() {
        return this.errorString;
    }
}
exports.CompileError = CompileError;
//# sourceMappingURL=CompileErrors.js.map