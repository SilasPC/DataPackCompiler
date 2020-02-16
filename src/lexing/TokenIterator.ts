
import { TokenI } from "./Token";
import { ModuleFile } from "../input/InputTree";

export interface TokenIteratorI {

    file: ModuleFile

    current(): TokenI
    peek(): TokenI
    next(): TokenI
    skip(n:number): this
    isDone(): boolean

    whitespaceBefore(): number
    whitespaceAfter(): number

    currentFollowsNewline(): boolean
    newLineFollows(): boolean

    [Symbol.iterator](): Iterator<TokenI>

}

export class TokenIterator implements TokenIteratorI {

    constructor(
        public readonly file: ModuleFile,
        private readonly tokens: TokenI[],
        private index = 0
    ) {}

    private prev() {return this.tokens[this.index-2]}
    current() {return this.tokens[this.index-1]}
    peek() {return this.tokens[this.index]}
    next() {return this.tokens[this.index++]}
    skip(n:number) {this.index+=n;return this}
    isDone() {return this.index >= this.tokens.length}

    whitespaceBefore() {
        let prev = this.prev()
        if (!prev) return 0
        let cur = this.current()
        return cur.indexStart - prev.indexEnd
    }

    whitespaceAfter() {
        let next = this.peek()
        if (!next) return 0
        let cur = this.current()
        return next.indexStart - cur.indexEnd
    }

    currentFollowsNewline() {
        let prev = this.prev()
        if (!prev) return false
        return prev.line.nr < this.current().line.nr
    }

    newLineFollows() {
        let next = this.peek()
        if (!next) return false
        return next.line.nr > this.current().line.nr
    }

    [Symbol.iterator]() {
        let self = this
        return {
            next() {
                let value = self.next() as TokenI
                return {
                    done: self.index > self.tokens.length,
                    value
                }
            }
        }
    }

}

export class LiveIterator implements TokenIteratorI {

    private readonly tokens: TokenI[] = []
    private index = 0
    private done = false

    constructor(
        public readonly file: ModuleFile,
        private readonly generator: /*Generator<TokenI,void>*/ Generator
    ) {}

    private prev() {return this.tokens[this.index-2]}
    private load() {
        if (this.tokens[this.index]) return
        let {done,value} = this.generator.next()
        if (done) this.done = true
        this.tokens[this.index] = value as TokenI
    }
    current() {return this.tokens[this.index-1]}
    peek() {
        this.load()
        return this.tokens[this.index]
    }
    next() {
        this.load()
        return this.tokens[this.index++]
    }
    skip(n:number) {
        for (let i = 0; i < n; i++) this.next()
        if (n < 0) this.index += n
        return this
    }
    isDone() {return this.done && this.index >= this.tokens.length}
    
    currentFollowsNewline() {
        if (!this.prev()) return false
        return this.prev().line.nr < this.current().line.nr
    }

    newLineFollows() {
        if (!this.next()) return false
        return this.next().line.nr > this.current().line.nr
    }
    
    whitespaceBefore() {
        let prev = this.prev()
        if (!prev) return 0
        let cur = this.current()
        return cur.indexStart - prev.indexEnd
    }

    whitespaceAfter() {
        let next = this.peek()
        if (!next) return 0
        let cur = this.current()
        return next.indexStart - cur.indexEnd
    }

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