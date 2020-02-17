import { SourceLine } from "../lexing/SourceLine"
import { TokenI } from "../lexing/Token"
import { TokenIterator } from "../lexing/TokenIterator"
import { ASTStaticBody } from "../syntax/AST"
import { Interspercer } from "../toolbox/Interspercer"
import { SourceCodeError } from "../toolbox/CompileErrors"

export class InputTree {

    public readonly modules = new Map<string,InputTree>()
    public readonly others = new Map<string,InputFile>()

    constructor(
        public module: ModuleFile | null
    ) {}

    public countAll(): number {
        let count = this.module ? 1 : 0
        for (let child of this.modules.values()) count += child.countAll()
        return count
    }

    public allModules(): ModuleFile[] {
        let mods: ModuleFile[] = []
        this.findModules(mods)
        return mods
    }
    private findModules(arr:ModuleFile[]) {
        if (this.module) arr.push(this.module)
        for (let child of this.modules.values()) child.findModules(arr)
    }

    public getStructureString() {
        let arr = ['root']
        this.structureString(arr,1)
        return arr.join('\n')
    }
    private structureString(arr:string[],i:number) {
        for (let [name,mod] of this.modules) {
            arr.push('  '.repeat(i)+name)
            mod.structureString(arr,i+1)
        }
        for (let [other] of this.others)
            arr.push('  '.repeat(i)+other)
    }

}

export class InputFile {

    public constructor(
        public readonly displayName: string,
        public readonly source: string
    ) {}

}

export class ModuleFile extends InputFile {
    
    private readonly lines: SourceLine[] = []
    private readonly tokens: TokenI[] = []
    
    addLine(l:SourceLine) {this.lines.push(l)}
    
    getLineFromIndex(i:number) {
        let l = this.lines.find(l=>l.indexEnd >= i && l.startIndex <= i)
        if (!l) throw new Error(`could not find line from index (${i} in ${this.displayName}), last was ${this.lines.pop()}`)
        return l
    }

    addToken(t:TokenI) {this.tokens.push(t)}
    getTokenIterator() {return new TokenIterator(this,this.tokens)}

    public readonly ast: ASTStaticBody = new Interspercer()

    throwUnexpectedEOF() {
        return (<TokenI>this.tokens.pop()).line.fatal('Unexpected EOF',0,0)
    }

    unexpectedEOI(): SourceCodeError {
        return new SourceCodeError(this,this.tokens[this.tokens.length-1].indexEnd,this.source.length-1,'Unexpected end of input')
    }
    
}

export class StructFile extends InputFile {}
