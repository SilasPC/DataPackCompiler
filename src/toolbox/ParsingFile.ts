
import { TokenI } from "../lexing/Token";
import { ASTStaticDeclaration } from "../syntax/AST";
import { promises as fs } from "fs";
import { resolve, relative, basename } from 'path'
import { TokenIterator } from "../lexing/TokenIterator";
import { ModDeclaration, DeclarationType } from "../semantics/declarations/Declaration";
import { Scope } from "../semantics/Scope";
import { SourceLine } from "../lexing/SourceLine";

export class ParsingFile {

    static async loadFile(path:string) {
        let fullPath = resolve(path)
        let relativePath = './'+relative('./',fullPath).replace(/\\/g,'/').split('.').slice(0,-1).join('.')
        let file = new ParsingFile(
            relativePath,
            fullPath,
            relativePath,
            (await fs.readFile(fullPath)).toString()
        )
        return file
    }

    static fromSource(source:string,sourceName:string) {
        return new ParsingFile(sourceName,'','',source)
    }

    private readonly lines: SourceLine[] = []
    private readonly tokens: TokenI[] = []

    private constructor(
        public readonly displayName: string,
        public readonly fullPath: string,
        public readonly relativePath: string,
        public readonly source: string
    ) {}

    addLine(l:SourceLine) {this.lines.push(l)}
    
    getLineFromIndex(i:number) {
        let l = this.lines.find(l=>l.indexEnd >= i && l.startIndex <= i)
        if (!l) throw new Error(`could not find line from index (${i} in ${this.displayName}), last was ${this.lines.pop()}`)
        return l
    }

    addToken(t:TokenI) {this.tokens.push(t)}
    getTokenIterator() {return new TokenIterator(this,this.tokens)}

    private readonly ast: ASTStaticDeclaration[] = []
    addASTNode(n:ASTStaticDeclaration) {this.ast.push(n)}
    getAST(): ReadonlyArray<ASTStaticDeclaration> {return this.ast}

    /*private pt: PTStatic[] = []
    addPT(pt:PTStatic) {this.pt.push(pt)}
    getPTs(): ReadonlyArray<PTStatic> {return this.pt}*/

    throwUnexpectedEOF() {
        return (<TokenI>this.tokens.pop()).line.fatal('Unexpected EOF',0,0)
    }

}
