import { ParsingFile } from "./ParsingFile"
import { CompileError, createErrorMessage } from "../toolbox/CompileErrors";
import cols from 'colors/safe'

export class SourceLine {

    public next: SourceLine|null = null

    constructor(
        public readonly previous: SourceLine|null,
        public readonly file: ParsingFile,
        public readonly startIndex: number,
        public readonly line: string,
        public readonly nr: number
    ) {}

    fatal(e:string,index:number,length:number): never {
        throw new Error(createErrorMessage(
            this,this,
            this.startIndex + index,
            this.startIndex + index + length,
            e
        ))
    }

}

export class Token {

    constructor(
        public readonly line: SourceLine,
        public readonly index: number,
        public readonly type: TokenType,
        public readonly value: string
    ) {}
    
    error(msg:string): CompileError {
        let fi = this.line.startIndex + this.index
        let li = fi + this.value.length
        return new CompileError(
            createErrorMessage(this.line,this.line,fi,li,msg),
            false
        )
    }

    warning(msg:string) {
        let fi = this.line.startIndex + this.index
        let li = fi + this.value.length
        return new CompileError(
            createErrorMessage(this.line,this.line,fi,li,msg),
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

export enum TokenType {
    KEYWORD,
    OPERATOR,
    PRIMITIVE,
    SYMBOL,
    MARKER,
    COMMAND,
    TYPE
}
