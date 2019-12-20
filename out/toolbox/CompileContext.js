"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const SyntaxSheet_1 = require("../commands/SyntaxSheet");
const ScoreboardManager_1 = require("./ScoreboardManager");
class CompileContext {
    constructor(options, syntaxSheet) {
        this.options = options;
        this.syntaxSheet = syntaxSheet;
        this.scoreboards = new ScoreboardManager_1.ScoreboardManager();
    }
    static getDefaultWithNullSheet() {
        return new CompileContext(config_1.compilerOptionDefaults({}), SyntaxSheet_1.SyntaxSheet.getNullSheet());
    }
    log(level, msg) {
        if (level <= this.options.verbosity)
            console.log(msg);
    }
}
exports.CompileContext = CompileContext;
//# sourceMappingURL=CompileContext.js.map