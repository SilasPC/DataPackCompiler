"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const SymbolTable_1 = require("./SymbolTable");
const TokenIterator_1 = require("./TokenIterator");
class ParsingFile {
    constructor(path) {
        this.tokens = [];
        this.ast = [];
        this.symbolTable = new SymbolTable_1.SymbolTable(null);
        this.status = 'lexed';
        this.fullPath = path;
        this.relativePath = './' + path_1.relative('./', path).replace('\\', '/').split('.').slice(0, -1).join('.');
        this.source = fs_1.readFileSync(this.fullPath).toString();
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
        let file = new ParsingFile(fullPath);
        this.files.set(fullPath, file);
        return file;
    }
    addToken(t) { this.tokens.push(t); }
    getTokenIterator() { return new TokenIterator_1.TokenIterator(this, this.tokens); }
    addASTNode(n) { this.ast.push(n); }
    getAST() { return this.ast; }
    getSymbolTable() { return this.symbolTable; }
    throwUnexpectedEOF() {
        return this.tokens.pop().throw('Unexpected EOF');
    }
}
ParsingFile.files = new Map();
exports.ParsingFile = ParsingFile;
//# sourceMappingURL=ParsingFile.js.map