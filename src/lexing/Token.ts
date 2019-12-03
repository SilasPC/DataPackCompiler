import { ParsingFile } from "./ParsingFile"

export class SourceLine {

    public next: SourceLine|null = null

    constructor(
        public readonly previous: SourceLine|null,
        public readonly file: ParsingFile,
        public readonly startIndex: number,
        public readonly line: string,
        public readonly nr: number
    ) {}

}

export class Token {

    constructor(
        public readonly line: SourceLine,
        public readonly index: number,
        public readonly type: TokenType,
        public readonly value: string
    ) {}

    expectType(...t:TokenType[]) {
        if (!t.includes(this.type)) return this.throw('expected type(s) '+t.map(t=>TokenType[t]).toString())
        return this
    }

    expectValue(...v:string[]) {
        if (!v.includes(this.value)) return this.throw('expected value(s) '+v.toString())
        return this
    }

    expectSemiColon() {
        return this.expectType(TokenType.MARKER).expectValue(';')
    }

    throwDebug(e:string) {return this.throw('DEBUG: '+e)}

    throw(e:string): never {
        let nrLen = (this.line.nr+(this.line.next?1:0)).toString().length
        let ws = ' '.repeat(nrLen+2)
        let msg: string[] = []
        msg.push(`Compile error ("${this.line.file.relativePath}":${this.line.nr}:${this.index}):`)
        msg.push(`${ws}${e}`)
        msg.push(`${ws}|`)
        if (this.line.previous)
            msg.push(` ${(this.line.nr-1).toString().padStart(nrLen,' ')} | ${this.line.previous.line}`)
        msg.push(` ${this.line.nr.toString().padStart(nrLen,' ')} | ${this.line.line}`)
        msg.push(`${ws}| ${' '.repeat(this.index)}${'^'.repeat(this.value.length)}`)
        if (this.line.next)
            msg.push(` ${(this.line.nr+1).toString().padStart(nrLen,' ')} | ${this.line.next.line}`)
        msg.push(`${ws}|`)
        throw new Error(msg.join('\n'))
    }

    throwUnexpectedKeyWord() {return this.throw('Unexpected keyword: '+this.value)}
    throwNotDefined() {return this.throw('Identifier not defined in this scope')}

}

export enum TokenType {
    KEYWORD,
    OPERATOR,
    PRIMITIVE,
    SYMBOL,
    MARKER,
    COMMAND,
    TYPE
}
