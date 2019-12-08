
import { ParsingFile } from "./ParsingFile";
import { Token } from "./Token";

export interface TokenIteratorI {

    current(): Token
    peek(): Token
    next(): Token
    skip(n:number): this
    isDone(): boolean

    [Symbol.iterator](): Iterator<Token>

}

export class TokenIterator implements TokenIteratorI {

    constructor(
        public readonly file: ParsingFile,
        private readonly tokens: Token[],
        private index = 0
    ) {}

    current() {return this.tokens[this.index-1]}
    peek() {return this.tokens[this.index]}
    next() {return this.tokens[this.index++]}
    skip(n:number) {this.index+=n;return this}
    isDone() {return this.index >= this.tokens.length}

    [Symbol.iterator]() {
        let self = this
        return {
            next() {
                let value = self.next()
                return {
                    done: self.index > self.tokens.length,
                    value
                }
            }
        }
    }

}

export class LiveIterator implements TokenIteratorI {

    private readonly tokens: Token[] = []
    private index = 0
    private done = false

    constructor(
        public readonly file: ParsingFile,
        private readonly generator: /*Generator<Token,void>*/ Generator
    ) {}

    current() {return this.tokens[this.index-1]}
    peek() {return this.tokens[this.index]}
    next() {
        if (!this.tokens[this.index]) {
            let {done,value} = this.generator.next()
            if (done) this.done = true
            this.tokens[this.index++] = value as Token
            return value as Token
        }
        return this.tokens[this.index++]
    }
    skip(n:number) {this.index+=n;return this}
    isDone() {return this.done && this.index >= this.tokens.length}

    [Symbol.iterator]() {
        let self = this
        return {
            next() {
                let value = self.next()
                return {
                    done: self.index > self.tokens.length,
                    value
                }
            }
        }
    }

}