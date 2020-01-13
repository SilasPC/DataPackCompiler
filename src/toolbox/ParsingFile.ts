
import { TokenI } from "../lexing/Token";
import { ASTNode, ASTStaticDeclaration } from "../syntax/AST";
import { promises as fs } from "fs";
import { resolve, relative, basename } from 'path'
import { TokenIterator } from "../lexing/TokenIterator";
import { DeclarationWrapper, Declaration, ModDeclaration } from "../semantics/Declaration";
import { Scope } from "../semantics/Scope";
import { CompileContext } from "./CompileContext";
import { SymbolTable } from "../semantics/SymbolTable";

export class ParsingFile extends SymbolTable {

    static extractUnsafe(pf:ParsingFile,name:string) {
        return pf.getUnsafe(name)
    }

    static async loadFile(path:string,ctx:CompileContext) {
        let fullPath = resolve(path)
        let relativePath = './'+relative('./',fullPath).replace(/\\/g,'/').split('.').slice(0,-1).join('.')
        let file = new ParsingFile(
            relativePath,
            fullPath,
            relativePath,
            (await fs.readFile(fullPath)).toString(),
            pf=>Scope.createRoot(pf,basename(fullPath).split('.').slice(0,-1).join('.'),ctx)
        )
        return file
    }

    static fromSource(source:string,sourceName:string,ctx:CompileContext) {
        return new ParsingFile(sourceName,'','',source,pf=>Scope.createRoot(pf,sourceName,ctx))
    }

    private readonly tokens: TokenI[] = []
    private readonly ast: ASTStaticDeclaration[] = []
    private readonly exports: Map<string,Declaration> = new Map()
    public readonly scope: Scope

    public status: 'lexed'|'parsing'|'parsed'|'generating'|'generated' = 'lexed'

    private constructor(
        public readonly displayName: string,
        public readonly fullPath: string,
        public readonly relativePath: string,
        public readonly source: string,
        scopeGen: (pf:ParsingFile)=>Scope
    ) {
        super(null)
        this.scope = scopeGen(this)
    }

    addToken(t:TokenI) {this.tokens.push(t)}
    getTokenIterator() {return new TokenIterator(this,this.tokens)}

    addASTNode(n:ASTStaticDeclaration) {this.ast.push(n)}
    getAST() {return this.ast}

    throwUnexpectedEOF() {
        return (<TokenI>this.tokens.pop()).line.fatal('Unexpected EOF',0,0)
    }

}
