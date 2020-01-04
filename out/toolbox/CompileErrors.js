"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const safe_1 = __importDefault(require("colors/safe"));
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
        super(errorString);
        this.errorString = errorString;
        this.warnOnly = warnOnly;
    }
    getErrorString() {
        return this.errorString;
    }
}
exports.CompileError = CompileError;
function createErrorMessage(fl, ll, fi, li, err) {
    let msg = [];
    let nrLen = ll.nr.toString().length;
    let ws = ' '.repeat(nrLen + 2);
    msg.push(`At ("${fl.file.relativePath}":${fl.nr}:${fi - fl.startIndex}):`);
    msg.push(`${ws}${err}`);
    msg.push(`${ws}|`);
    if (fl.previous)
        msg.push(` ${(fl.nr - 1).toString().padStart(nrLen, ' ')} | ${fl.previous.line}`);
    let l = fl;
    let lines = [fl];
    while (l != ll && l != null) {
        lines.push(l);
        l = l.next;
    }
    if (lines.length > 3) {
        let prevLine = lines[0];
        let placeholder = ':'.repeat((prevLine.nr).toString().length).padStart(nrLen, ' ');
        lines = lines.slice(0, 1).concat(` ${placeholder} |`, lines.slice(-1));
    }
    for (let line of lines) {
        if (typeof line == 'string') {
            msg.push(line);
            continue;
        }
        let wss = line.line.length - line.line.trimLeft().length;
        let c0 = Math.max(fi - line.startIndex, wss);
        let c1 = Math.min(li - line.startIndex, line.line.trimRight().length);
        msg.push(` ${line.nr.toString().padStart(nrLen, ' ')} | ${line.line.slice(0, c0)}${safe_1.default.inverse(line.line.slice(c0, c1))}${line.line.slice(c1)}`);
    }
    if (ll.next)
        msg.push(` ${(ll.nr + 1).toString().padStart(nrLen, ' ')} | ${ll.next.line}`);
    // msg.push(`${ws}| ${' '.repeat(i)}${'^'.repeat(l)}`)
    msg.push(`${ws}|`);
    return msg.join('\n');
}
exports.createErrorMessage = createErrorMessage;
//# sourceMappingURL=CompileErrors.js.map