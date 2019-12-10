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
    warn(e, i, l) {
        console.log(this.errorMessage('Warning', e, i, l));
    }
    fatal(e, i, l) {
        throw new Error(this.errorMessage('Fatal', e, i, l));
    }
    errorMessage(type, e, i, l) {
        if (typeof i == 'undefined') {
            i = 0;
            l = 1;
        }
        else if (typeof l == 'undefined')
            l = this.line.length;
        let nrLen = (this.nr + (this.next ? 1 : 0)).toString().length;
        let ws = ' '.repeat(nrLen + 2);
        let msg = [];
        msg.push(`${type} ("${this.file.relativePath}":${this.nr}:${i}):`);
        msg.push(`${ws}${e}`);
        msg.push(`${ws}|`);
        if (this.previous)
            msg.push(` ${(this.nr - 1).toString().padStart(nrLen, ' ')} | ${this.previous.line}`);
        msg.push(` ${this.nr.toString().padStart(nrLen, ' ')} | ${this.line}`);
        msg.push(`${ws}| ${' '.repeat(i)}${'^'.repeat(l)}`);
        if (this.next)
            msg.push(` ${(this.nr + 1).toString().padStart(nrLen, ' ')} | ${this.next.line}`);
        msg.push(`${ws}|`);
        return msg.join('\n');
    }
}
exports.SourceLine = SourceLine;
class Token {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
    expectType(...t) {
        if (!t.includes(this.type))
            return this.fatal('expected type(s) ' + t.map(t => TokenType[t]).toString());
        return this;
    }
    expectValue(...v) {
        if (!v.includes(this.value))
            return this.fatal('expected value(s) ' + v.toString());
        return this;
    }
    expectSemiColon() {
        return this.expectType(TokenType.MARKER).expectValue(';');
    }
    throwDebug(e) { return this.fatal('DEBUG: ' + e); }
    fatal(e) { throw new Error('Fatal: ' + e); }
    warn(e) { console.log('Warning: ' + e); }
    throwUnexpectedKeyWord() { return this.fatal('Unexpected keyword: ' + this.value); }
    throwNotDefined() { return this.fatal('Identifier not defined in this scope'); }
}
exports.Token = Token;
class TrueToken extends Token {
    constructor(line, index, type, value) {
        super(type, value);
        this.line = line;
        this.index = index;
    }
    fatal(e) { return this.line.fatal(e, this.index, this.value.length); }
    warn(e) { this.line.warn(e, this.index, this.value.length); }
}
exports.TrueToken = TrueToken;
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