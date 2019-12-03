"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TokenIterator {
    constructor(file, tokens, index = 0) {
        this.file = file;
        this.tokens = tokens;
        this.index = index;
    }
    current() { return this.tokens[this.index - 1]; }
    peek() { return this.tokens[this.index]; }
    next() { return this.tokens[this.index++]; }
    skip(n) { this.index += n; return this; }
    isDone() { return this.index > this.tokens.length; }
    [Symbol.iterator]() {
        let self = this;
        return {
            next() {
                let value = self.tokens[self.index++];
                return {
                    done: self.isDone(),
                    value
                };
            }
        };
    }
}
exports.TokenIterator = TokenIterator;
//# sourceMappingURL=TokenIterator.js.map