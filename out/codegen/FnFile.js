"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FnFile {
    constructor(name, code = []) {
        this.name = name;
        this.code = code;
    }
    get() { return this.code; }
    add(...instrs) { this.code.push(...instrs); }
}
exports.FnFile = FnFile;
//# sourceMappingURL=FnFile.js.map