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
    isDone() { return this.index >= this.tokens.length; }
    [Symbol.iterator]() {
        let self = this;
        return {
            next() {
                let value = self.next();
                return {
                    done: self.index > self.tokens.length,
                    value
                };
            }
        };
    }
}
exports.TokenIterator = TokenIterator;
class LiveIterator {
    constructor(generator) {
        this.generator = generator;
        this.tokens = [];
        this.index = 0;
        this.done = false;
    }
    current() { return this.tokens[this.index - 1]; }
    peek() { return this.tokens[this.index]; }
    next() {
        if (!this.tokens[this.index]) {
            let { done, value } = this.generator.next();
            if (done)
                this.done = true;
            this.tokens[this.index++] = value;
            return value;
        }
        return this.tokens[this.index++];
    }
    skip(n) { this.index += n; return this; }
    isDone() { return this.done && this.index >= this.tokens.length; }
    [Symbol.iterator]() {
        let self = this;
        return {
            next() {
                let value = self.next();
                return {
                    done: self.index > self.tokens.length,
                    value
                };
            }
        };
    }
}
exports.LiveIterator = LiveIterator;
//# sourceMappingURL=TokenIterator.js.map