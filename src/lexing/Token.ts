import { ParsingFile } from "./ParsingFile"
import { Errorable } from "../toolbox/other";

export class SourceLine implements Errorable {

    public next: SourceLine|null = null

    constructor(
        public readonly previous: SourceLine|null,
        public readonly file: ParsingFile,
        public readonly startIndex: number,
        public readonly line: string,
        public readonly nr: number
    ) {}

    warn(e:string,i?:number,l?:number) {
        console.log(this.errorMessage('Warning',e,i,l))
    }
    fatal(e:string,i?:number,l?:number): never {
        throw new Error(this.errorMessage('Fatal',e,i,l))
    }
    
    private errorMessage(type:string,e:string,i?:number,l?:number) {
        if (typeof i == 'undefined') {i = 0; l = 1}
        else if (typeof l == 'undefined') l = this.line.length
        let nrLen = (this.nr+(this.next?1:0)).toString().length
        let ws = ' '.repeat(nrLen+2)
        let msg: string[] = []
        msg.push(`${type} ("${this.file.relativePath}":${this.nr}:${i}):`)
        msg.push(`${ws}${e}`)
        msg.push(`${ws}|`)
        if (this.previous)
            msg.push(` ${(this.nr-1).toString().padStart(nrLen,' ')} | ${this.previous.line}`)
        msg.push(` ${this.nr.toString().padStart(nrLen,' ')} | ${this.line}`)
        msg.push(`${ws}| ${' '.repeat(i)}${'^'.repeat(l)}`)
        if (this.next)
            msg.push(` ${(this.nr+1).toString().padStart(nrLen,' ')} | ${this.next.line}`)
        msg.push(`${ws}|`)
        return msg.join('\n')
    }

}

export class Token implements Errorable {

    constructor(
        public readonly line: SourceLine,
        public readonly index: number,
        public readonly type: TokenType,
        public readonly value: string
    ) {}

    expectType(...t:TokenType[]) {
        if (!t.includes(this.type)) return this.fatal('expected type(s) '+t.map(t=>TokenType[t]).toString())
        return this
    }

    expectValue(...v:string[]) {
        if (!v.includes(this.value)) return this.fatal('expected value(s) '+v.toString())
        return this
    }

    expectSemiColon() {
        return this.expectType(TokenType.MARKER).expectValue(';')
    }

    throwDebug(e:string) {return this.fatal('DEBUG: '+e)}

    fatal(e:string) {return this.line.fatal(e,this.index,this.value.length)}
    warn(e:string) {this.line.warn(e,this.index,this.value.length)}

    throwUnexpectedKeyWord() {return this.fatal('Unexpected keyword: '+this.value)}
    throwNotDefined() {return this.fatal('Identifier not defined in this scope')}

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
