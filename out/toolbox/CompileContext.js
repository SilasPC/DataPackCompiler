"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const SyntaxSheet_1 = require("../commands/SyntaxSheet");
const ScoreboardManager_1 = require("./ScoreboardManager");
const ParsingFile_1 = require("../lexing/ParsingFile");
const path_1 = require("path");
const FnFile_1 = require("../codegen/FnFile");
const other_1 = require("./other");
const safe_1 = __importDefault(require("colors/safe"));
class CompileContext {
    constructor(options, syntaxSheet) {
        this.options = options;
        this.syntaxSheet = syntaxSheet;
        this.files = new Map();
        this.fnFiles = new Map();
        this.scoreboards = new ScoreboardManager_1.ScoreboardManager(this.options);
        this.lastLogLevel = 0;
        this.lastLogType = null;
    }
    static getDefaultWithNullSheet() {
        return new CompileContext(config_1.compilerOptionDefaults({}), SyntaxSheet_1.SyntaxSheet.getNullSheet());
    }
    isFileLoaded(path) {
        let fullPath = path_1.resolve(path);
        return this.files.has(fullPath);
    }
    getLoadedFile(path) {
        if (!this.isFileLoaded(path))
            throw new Error('Tried getting a non-loaded file');
        let fullPath = path_1.resolve(path);
        return this.files.get(fullPath);
    }
    loadFile(path) {
        if (this.isFileLoaded(path))
            throw new Error('Tried re-loading a file');
        return ParsingFile_1.ParsingFile.loadFile(path, this);
    }
    loadFromSource(source) {
        return ParsingFile_1.ParsingFile.fromSource(source, this);
    }
    createFnFile(names) {
        let name = this.options.obscureNames ?
            other_1.getObscureName(this.fnFiles) :
            other_1.getQualifiedName(names, this.fnFiles, Infinity);
        let fn = new FnFile_1.FnFile(name);
        this.fnFiles.set(name, fn);
        return fn;
    }
    getFnFiles() {
        return [...this.fnFiles.values()];
    }
    log(level, msg) {
        if (level > this.options.verbosity)
            return;
        if (this.lastLogLevel > level)
            console.log();
        let pad = '';
        if (level > 1)
            pad = ' '.repeat(2 * level - 3) + '- ';
        console.log(pad + msg);
        this.lastLogLevel = level;
    }
    logErrors(errors) {
        for (let err of errors.getErrors()) {
            this.lastLogType = null;
            this.log2(0, 'err', err.getErrorString());
        }
        this.lastLogType = null;
    }
    // private lastLogLevel2 = 0
    log2(level, type, msg) {
        if (level > this.options.verbosity)
            return;
        let col = type == 'inf' ? safe_1.default.green : type == 'wrn' ? safe_1.default.yellow : safe_1.default.red;
        if (!this.options.colorLog)
            col = (s) => s;
        let pad = col('    ] ');
        let padh = col(`\n[${type}] `);
        console.log(msg
            .split('\n')
            .map((s, i) => col(i == 0 && this.lastLogType != type ? padh : pad) + s)
            .join('\n'));
        // this.lastLogLevel2 = level
        this.lastLogType = type;
    }
}
exports.CompileContext = CompileContext;
//# sourceMappingURL=CompileContext.js.map