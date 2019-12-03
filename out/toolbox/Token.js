"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SourceLine {
    constructor(previous, file, startIndex, line, nr) {
        this.previous = previous;
        this.file = file;
        this.startIndex = startIndex;
        this.line = line;
        this.nr = nr;
        this.next = null;
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
    expectType(...t) {
        if (!t.includes(this.type))
            return this.throw('expected type(s) ' + t.map(t => TokenType[t]).toString());
        return this;
    }
    expectValue(...v) {
        if (!v.includes(this.value))
            return this.throw('expected value(s) ' + v.toString());
        return this;
    }
    expectSemiColon() {
        return this.expectType(TokenType.MARKER).expectValue(';');
    }
    throwDebug(e) { return this.throw('DEBUG: ' + e); }
    throw(e) {
        let nrLen = (this.line.nr + (this.line.next ? 1 : 0)).toString().length;
        let ws = ' '.repeat(nrLen + 2);
        console.error(`Compile error ("${this.line.file.relativePath}":${this.line.nr}:${this.index}):`);
        console.error(`${ws}${e}`);
        console.error(`${ws}|`);
        if (this.line.previous)
            console.error(` ${(this.line.nr - 1).toString().padStart(nrLen, ' ')} | ${this.line.previous.line}`);
        console.error(` ${this.line.nr.toString().padStart(nrLen, ' ')} | ${this.line.line}`);
        console.error(`${ws}| ${' '.repeat(this.index)}${'^'.repeat(this.value.length)}`);
        if (this.line.next)
            console.error(` ${(this.line.nr + 1).toString().padStart(nrLen, ' ')} | ${this.line.next.line}`);
        console.error(`${ws}|`);
        console.trace();
        return process.exit();
    }
    throwUnexpectedKeyWord() { return this.throw('Unexpected keyword: ' + this.value); }
    throwNotDefined() { return this.throw('Identifier not defined in this scope'); }
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
})(TokenType = exports.TokenType || (exports.TokenType = {}));
//# sourceMappingURL=Token.js.map