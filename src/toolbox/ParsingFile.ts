
import { TokenI } from "../lexing/Token";
import { ASTNode, ASTStaticDeclaration } from "../syntax/AST";
import { promises as fs } from "fs";
import { resolve, relative, basename } from 'path'
import { TokenIterator } from "../lexing/TokenIterator";
import { DeclarationWrapper, Declaration, ModDeclaration, DeclarationType } from "../semantics/Declaration";
import { Scope } from "../semantics/Scope";
import { CompileContext } from "./CompileContext";
import { SymbolTable } from "../semantics/SymbolTable";
import { SourceLine } from "../lexing/SourceLine";
import { ParseTree, PTStatic } from "../semantics/ParseTree";

export class ParsingFile {

    static async loadFile(path:string) {
        let fullPath = resolve(path)
        let relativePath = './'+relative('./',fullPath).replace(/\\/g,'/').split('.').slice(0,-1).join('.')
        let file = new ParsingFile(
            relativePath,
            fullPath,
            relativePath,
            (await fs.readFile(fullPath)).toString(),
            pf=>Scope.createRoot(basename(fullPath).split('.').slice(0,-1).join('.'))
        )
        return file
    }

    static fromSource(source:string,sourceName:string) {
        return new ParsingFile(sourceName,'','',source,pf=>Scope.createRoot(sourceName))
    }

    private readonly lines: SourceLine[] = []
    private readonly tokens: TokenI[] = []
    public readonly scope: Scope

    readonly module: ModDeclaration

    public status: 'lexed'|'parsing'|'parsed'|'generating'|'generated' = 'lexed'

    private constructor(
        public readonly displayName: string,
        public readonly fullPath: string,
        public readonly relativePath: string,
        public readonly source: string,
        scopeGen: (pf:ParsingFile)=>Scope
    ) {
        this.scope = scopeGen(this)
        this.module = {
            type: DeclarationType.MODULE,
            symbols: this.scope.symbols,
            namePath: this.scope.getScopeNames()
        }
    }

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
