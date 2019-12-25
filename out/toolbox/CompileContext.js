"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const SyntaxSheet_1 = require("../commands/SyntaxSheet");
const ScoreboardManager_1 = require("./ScoreboardManager");
const ParsingFile_1 = require("../lexing/ParsingFile");
const path_1 = require("path");
const FnFile_1 = require("../codegen/FnFile");
const other_1 = require("./other");
class CompileContext {
    constructor(options, syntaxSheet) {
        this.options = options;
        this.syntaxSheet = syntaxSheet;
        this.files = new Map();
        this.fnFiles = new Map();
        this.scoreboards = new ScoreboardManager_1.ScoreboardManager(this.options);
        this.lastLogLevel = 0;
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