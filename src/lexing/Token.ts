
import { SourceCodeError } from "../toolbox/CompileErrors";
import { SourceLine } from "./SourceLine";
import { Keyword, Operator, Type, Marker } from "./values";

export enum TokenType {
    KEYWORD,
    OPERATOR,
    PRIMITIVE,
    SYMBOL,
    MARKER,
    COMMAND,
    TYPE,
    SELECTOR,
    DIRECTIVE
}

export type TokenI = GenericToken | KeywordToken | OpToken | TypeToken | MarkerToken | DirectiveToken

export interface GenericToken extends Token {
    readonly type: TokenType.COMMAND | TokenType.PRIMITIVE | TokenType.SYMBOL | TokenType.SELECTOR
    readonly value: string
}

export interface MarkerToken extends Token {
    readonly type: TokenType.MARKER
    readonly value: Marker
}

export interface KeywordToken extends Token {
    readonly type: TokenType.KEYWORD
    readonly value: Keyword
}

export interface OpToken extends Token {
    readonly type: TokenType.OPERATOR
    readonly value: Operator
}

export interface DirectiveToken extends Token {
    readonly type: TokenType.DIRECTIVE
}

export interface TypeToken extends Token {
    readonly type: TokenType.TYPE
    readonly value: Type
}

export class Token {

    static create(line: SourceLine, index: number, type: TokenType, value: string): TokenI {
        if (value.includes('\n')) throw new Error('newline in token')
        return new Token(line,index,type,value) as TokenI
    }

    public readonly indexEnd: number
    public readonly indexStart: number

    private constructor(
        public readonly line: SourceLine,
        public readonly indexLine: number,
        public readonly type: TokenType,
        public readonly value: string
    ) {
        this.indexStart = indexLine + line.startIndex
        this.indexEnd = this.indexStart + this.value.length
    }
    
    error(msg:string): SourceCodeError {
        let fi = this.line.startIndex + this.indexLine
        let li = fi + this.value.length
        return new SourceCodeError(
            this.line.file,fi,li,msg
        )
    }

    errorAt(i:number,msg:string) {
        let fi = this.indexStart + Math.min(i, this.value.length - 1)
        let li = this.indexEnd
        return new SourceCodeError(
            this.line.file,fi,li,msg
        )
    }

    expectType(...t:TokenType[]) {if (!t.includes(this.type)) throw this.error('expected type(s) '+t.map(t=>TokenType[t]).toString());return this}
    expectValue(...v:string[]) {if (!v.includes(this.value)) throw this.error('expected value(s) '+v.toString());return this}
    expectSemiColon() {return this.expectType(TokenType.MARKER).expectValue(';')}
    throwDebug(e:string): never {throw this.error('DEBUG '+e)}
    throwUnexpectedKeyWord(): never {throw this.error('Unexpected keyword: '+this.value)}

}
