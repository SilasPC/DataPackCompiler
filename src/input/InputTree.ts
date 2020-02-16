import { SourceLine } from "../lexing/SourceLine"
import { TokenI } from "../lexing/Token"
import { TokenIterator } from "../lexing/TokenIterator"
import { ASTStaticBody } from "../syntax/AST"
import { Interspercer } from "../toolbox/Interspercer"

export class InputTree {

    public readonly modules = new Map<string,InputTree>()
    public readonly other = new Map<string,InputFile>()

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
        if (this.module) mods.push(this.module)
        for (let child of this.modules.values()) mods.concat(child.allModules())
        return mods
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
    
}

export class StructFile extends InputFile {}
