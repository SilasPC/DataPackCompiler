"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FnFile {
    constructor(name) {
        this.name = name;
        this.code = [];
    }
    getCode() { return this.code; }
    addLines(...lines) { this.code.push(...lines); }
}
exports.FnFile = FnFile;
//# sourceMappingURL=FnFile.js.map