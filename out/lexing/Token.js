"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CompileErrors_1 = require("../toolbox/CompileErrors");
class SourceLine {
    constructor(previous, file, startIndex, line, nr) {
        this.previous = previous;
        this.file = file;
        this.startIndex = startIndex;
        this.line = line;
        this.nr = nr;
        this.next = null;
    }
    fatal(e, index, length) {
        throw new Error(CompileErrors_1.createErrorMessage(this, this, this.startIndex + index, this.startIndex + index + length, e));
    }
}
exports.SourceLine = SourceLine;
class Token {
    constructor(line, index, type, value) {
        this.line = line;
        this.index = index;
        this.type = type;
        this.value = value;
    }
    error(msg) {
        let fi = this.line.startIndex + this.index;
        let li = fi + this.value.length;
        return new CompileErrors_1.CompileError(CompileErrors_1.createErrorMessage(this.line, this.line, fi, li, msg), false);
    }
    warning(msg) {
        let fi = this.line.startIndex + this.index;
        let li = fi + this.value.length;
        return new CompileErrors_1.CompileError(CompileErrors_1.createErrorMessage(this.line, this.line, fi, li, msg), true);
    }
    expectType(...t) { if (!t.includes(this.type))
        throw this.error('expected type(s) ' + t.map(t => TokenType[t]).toString()); return this; }
    expectValue(...v) { if (!v.includes(this.value))
        throw this.error('expected value(s) ' + v.toString()); return this; }
    expectSemiColon() { return this.expectType(TokenType.MARKER).expectValue(';'); }
    throwDebug(e) { throw this.error('DEBUG ' + e); }
    throwUnexpectedKeyWord() { throw this.error('Unexpected keyword: ' + this.value); }
    throwNotDefined() { throw this.error('Identifier not defined in this scope'); }
}
exports.Token = Token;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["KEYWORD"] = 0] = "KEYWORD";
    TokenType[TokenType["OPERATOR"] = 1] = "OPERATOR";
    TokenType[TokenType["PRIMITIVE"] = 2] = "PRIMITIVE";
    TokenType[TokenType["SYMBOL"] = 3] = "SYMBOL";
    TokenType[TokenType["MARKER"] = 4] = "MARKER";
    TokenType[TokenType["COMMAND"] = 5] = "COMMAND";
    TokenType[TokenType["TYPE"] = 6] = "TYPE";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
//# sourceMappingURL=Token.js.map