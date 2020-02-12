import { ParsingFile } from "../toolbox/ParsingFile"
import { CompileError, createErrorMessage } from "../toolbox/CompileErrors";
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
    SELECTOR
}

export type TokenI = GenericToken | KeywordToken | OpToken | TypeToken | MarkerToken

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

export interface TypeToken extends Token {
    readonly type: TokenType.TYPE
    readonly value: Type
}

export class Token {

    // Workaround to ensure Lexeme behaves 
    // as type Token during typechecking
    static create(line: SourceLine, index: number, type: TokenType, value: string): TokenI {
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
    
    error(msg:string): CompileError {
        let fi = this.line.startIndex + this.indexLine
        let li = fi + this.value.length
        return new CompileError(
            createErrorMessage(this.line.file,fi,li,msg),
            false
        )
    }

    errorAt(i:number,msg:string) {
        let fi = this.indexStart + Math.min(i, this.value.length - 1)
        let li = this.indexEnd
        return new CompileError(
            createErrorMessage(this.line.file,fi,li,msg),
            false
        )
    }

    warning(msg:string): CompileError {
        let fi = this.line.startIndex + this.indexLine
        let li = fi + this.value.length
        return new CompileError(
            createErrorMessage(this.line.file,fi,li,msg),
            true
        )
    }

    expectType(...t:TokenType[]) {if (!t.includes(this.type)) throw this.error('expected type(s) '+t.map(t=>TokenType[t]).toString());return this}
    expectValue(...v:string[]) {if (!v.includes(this.value)) throw this.error('expected value(s) '+v.toString());return this}
    expectSemiColon() {return this.expectType(TokenType.MARKER).expectValue(';')}
    throwDebug(e:string): never {throw this.error('DEBUG '+e)}
    throwUnexpectedKeyWord(): never {throw this.error('Unexpected keyword: '+this.value)}
    throwNotDefined(): never {throw this.error('Identifier not defined in this scope')}

}
