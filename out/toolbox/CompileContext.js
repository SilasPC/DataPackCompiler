"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const SyntaxSheet_1 = require("../commands/SyntaxSheet");
const ScoreboardManager_1 = require("./ScoreboardManager");
class CompileContext {
    constructor(options, syntaxSheet) {
        this.options = options;
        this.syntaxSheet = syntaxSheet;
        this.scoreboards = new ScoreboardManager_1.ScoreboardManager(this.options);
        this.lastLogLevel = 0;
    }
    static getDefaultWithNullSheet() {
        return new CompileContext(config_1.compilerOptionDefaults({}), SyntaxSheet_1.SyntaxSheet.getNullSheet());
    }
    log(level, msg) {
        if (this.lastLogLevel > level)
            console.log();
        let pad = '';
        if (level > 1)
            pad = ' '.repeat(2 * level - 3) + '- ';
        if (level <= this.options.verbosity)
            console.log(pad + msg);
        this.lastLogLevel = level;
    }
}
exports.CompileContext = CompileContext;
//# sourceMappingURL=CompileContext.js.map