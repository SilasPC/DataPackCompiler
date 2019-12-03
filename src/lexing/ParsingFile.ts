
import { Token } from "./Token";
import { ASTNode } from "../syntax/AST";
import { readFileSync } from "fs";
import { resolve, relative } from 'path'
import { SymbolTable } from "../semantics/SymbolTable";
import { TokenIterator } from "./TokenIterator";

export class ParsingFile {

    private static files: Map<string,ParsingFile> = new Map()

    static isLoaded(path:string) {
        let fullPath = resolve(path)
        return this.files.has(fullPath)
    }

    static getFile(path:string) {
        if (!this.isLoaded(path)) throw new Error('Tried getting a non-loaded file')
        let fullPath = resolve(path)
        return this.files.get(fullPath)
    }

    static loadFile(path:string) {
        if (this.isLoaded(path)) throw new Error('Tried re-loading a file')
        let fullPath = resolve(path)
        let relativePath = './'+relative('./',fullPath).replace('\\','/').split('.').slice(0,-1).join('.')
        let file = new ParsingFile(fullPath,relativePath,readFileSync(fullPath).toString())
        this.files.set(fullPath,file)
        return file
    }

    static fromSource(source:string) {
        return new ParsingFile('','',source)
    }

    private readonly tokens: Token[] = []
    private readonly ast: ASTNode[] = []
    private readonly symbolTable: SymbolTable = new SymbolTable(null)

    public status: 'lexed'|'parsing'|'parsed'|'generating'|'generated' = 'lexed'

    private constructor(
        public readonly fullPath: string,
        public readonly relativePath: string,
        public readonly source: string
    ) {}
    addToken(t:Token) {this.tokens.push(t)}
    getTokenIterator() {return new TokenIterator(this,this.tokens)}

    addASTNode(n:ASTNode) {this.ast.push(n)}
    getAST() {return this.ast}

    getSymbolTable() {return this.symbolTable}

    throwUnexpectedEOF() {
        return (<Token>this.tokens.pop()).throw('Unexpected EOF')
    }

}
