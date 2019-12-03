"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Token {
    constructor(input, file, lineNr, type) {
        this.input = input;
        this.file = file;
        this.lineNr = lineNr;
        this.type = type;
    }
}
exports.Token = Token;
class TokenIterator {
    [Symbol.iterator]() {
    }
}
exports.TokenIterator = TokenIterator;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["KEYWORD"] = 0] = "KEYWORD";
    TokenType[TokenType["OPERATOR"] = 1] = "OPERATOR";
    TokenType[TokenType["PRIMITIVE"] = 2] = "PRIMITIVE";
    TokenType[TokenType["SYMBOL"] = 3] = "SYMBOL";
    TokenType[TokenType["MARKER"] = 4] = "MARKER";
    TokenType[TokenType["COMMAND"] = 5] = "COMMAND";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
