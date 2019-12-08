"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const SymbolTable_1 = require("../semantics/SymbolTable");
const TokenIterator_1 = require("./TokenIterator");
class ParsingFile {
    constructor(fullPath, relativePath, source) {
        this.fullPath = fullPath;
        this.relativePath = relativePath;
        this.source = source;
        this.tokens = [];
        this.ast = [];
        this.symbolTable = new SymbolTable_1.SymbolTable(null);
        this.exports = new Map();
        this.status = 'lexed';
    }
    static isLoaded(path) {
        let fullPath = path_1.resolve(path);
        return this.files.has(fullPath);
    }
    static getFile(path) {
        if (!this.isLoaded(path))
            throw new Error('Tried getting a non-loaded file');
        let fullPath = path_1.resolve(path);
        return this.files.get(fullPath);
    }
    static loadFile(path) {
        if (this.isLoaded(path))
            throw new Error('Tried re-loading a file');
        let fullPath = path_1.resolve(path);
        let relativePath = './' + path_1.relative('./', fullPath).replace('\\', '/').split('.').slice(0, -1).join('.');
        let file = new ParsingFile(fullPath, relativePath, fs_1.readFileSync(fullPath).toString());
        this.files.set(fullPath, file);
        return file;
    }
    static fromSource(source) {
        return new ParsingFile('', '', source);
    }
    addToken(t) { this.tokens.push(t); }
    getTokenIterator() { return new TokenIterator_1.TokenIterator(this, this.tokens); }
    addASTNode(n) { this.ast.push(n); }
    getAST() { return this.ast; }
    getSymbolTable() { return this.symbolTable; }
    addExport(identifier, declaration) {
        if (this.exports.has(identifier))
            throw new Error('export duplicate identifier');
        this.exports.set(identifier, declaration);
    }
    import(identifier) {
        if (!this.exports.has(identifier.value))
            identifier.throwDebug('no such exported member');
        return this.exports.get(identifier.value);
    }
    throwUnexpectedEOF() {
        return this.tokens.pop().fatal('Unexpected EOF');
    }
}
ParsingFile.files = new Map();
exports.ParsingFile = ParsingFile;
//# sourceMappingURL=ParsingFile.js.map