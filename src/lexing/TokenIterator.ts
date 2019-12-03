
import { ParsingFile } from "./ParsingFile";
import { Token } from "./Token";

export class TokenIterator {

    constructor(
        public readonly file: ParsingFile,
        private readonly tokens: Token[],
        private index = 0
    ) {}

    current() {return this.tokens[this.index-1]}
    peek() {return this.tokens[this.index]}
    next() {return this.tokens[this.index++]}
    skip(n:number) {this.index+=n;return this}
    isDone() {return this.index > this.tokens.length}

    [Symbol.iterator]() {
        let self = this
        return {
            next() {
                let value = self.tokens[self.index++]
                return {
                    done: self.isDone(),
                    value
                }
            }
        }
    }

}
