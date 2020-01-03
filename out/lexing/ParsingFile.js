"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const TokenIterator_1 = require("./TokenIterator");
const Scope_1 = require("../semantics/Scope");
class ParsingFile {
    constructor(fullPath, relativePath, source, scope) {
        this.fullPath = fullPath;
        this.relativePath = relativePath;
        this.source = source;
        this.scope = scope;
        this.tokens = [];
        this.ast = [];
        this.exports = new Map();
        this.status = 'lexed';
    }
    static loadFile(path, ctx) {
        let fullPath = path_1.resolve(path);
        let relativePath = './' + path_1.relative('./', fullPath).replace('\\', '/').split('.').slice(0, -1).join('.');
        let file = new ParsingFile(fullPath, relativePath, fs_1.readFileSync(fullPath).
            toString(), Scope_1.Scope.createRoot(path_1.basename(fullPath).split('.').slice(0, -1).join('.'), ctx));
        return file;
    }
    static fromSource(source, ctx) {
        return new ParsingFile('', '', source, Scope_1.Scope.createRoot('source', ctx));
    }
    addToken(t) { this.tokens.push(t); }
    getTokenIterator() { return new TokenIterator_1.TokenIterator(this, this.tokens); }
    addASTNode(n) { this.ast.push(n); }
    getAST() { return this.ast; }
    getSymbolTable() { return this.scope.symbols; }
    addExport(identifier, declaration) {
        if (this.exports.has(identifier))
            throw new Error('export duplicate identifier');
        this.exports.set(identifier, declaration);
    }
    hasExport(id) { return this.exports.has(id); }
    import(identifier) {
        if (!this.exports.has(identifier.value))
            identifier.throwDebug('no such exported member');
        return this.exports.get(identifier.value);
    }
    throwUnexpectedEOF() {
        return this.tokens.pop().fatal('Unexpected EOF');
    }
}
exports.ParsingFile = ParsingFile;
//# sourceMappingURL=ParsingFile.js.map