"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CompileContext {
    constructor(options, syntaxSheet) {
        this.options = options;
        this.syntaxSheet = syntaxSheet;
    }
    log(level, msg) {
        if (level <= this.options.verbosity)
            console.log(msg);
    }
}
exports.CompileContext = CompileContext;
//# sourceMappingURL=CompileContext.js.map