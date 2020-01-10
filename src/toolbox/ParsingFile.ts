
import { TokenI } from "../lexing/Token";
import { ASTNode, ASTStaticDeclaration } from "../syntax/AST";
import { readFileSync } from "fs";
import { resolve, relative, basename } from 'path'
import { SymbolTable } from "../semantics/SymbolTable";
import { TokenIterator } from "../lexing/TokenIterator";
import { DeclarationWrapper, Declaration } from "../semantics/Declaration";
import { Scope } from "../semantics/Scope";
import { CompileContext } from "./CompileContext";

export class ParsingFile {

    static loadFile(path:string,ctx:CompileContext) {
        let fullPath = resolve(path)
        let relativePath = './'+relative('./',fullPath).replace(/\\/g,'/').split('.').slice(0,-1).join('.')
        let file = new ParsingFile(
            fullPath,
            relativePath,
            readFileSync(fullPath).
            toString(),
            Scope.createRoot(basename(fullPath).split('.').slice(0,-1).join('.'),ctx)
        )
        return file
    }

    static fromSource(source:string,ctx:CompileContext) {
        return new ParsingFile('','',source,Scope.createRoot('source',ctx))
    }

    private readonly tokens: TokenI[] = []
    private readonly ast: ASTStaticDeclaration[] = []
    private readonly exports: Map<string,Declaration> = new Map()

    public status: 'lexed'|'parsing'|'parsed'|'generating'|'generated' = 'lexed'

    private constructor(
        public readonly fullPath: string,
        public readonly relativePath: string,
        public readonly source: string,
        public readonly scope: Scope
    ) {}

    addToken(t:TokenI) {this.tokens.push(t)}
    getTokenIterator() {return new TokenIterator(this,this.tokens)}

    addASTNode(n:ASTStaticDeclaration) {this.ast.push(n)}
    getAST() {return this.ast}

    getSymbolTable() {return this.scope.symbols}
    addExport(decl:DeclarationWrapper) {
        if (this.exports.has(decl.token.value)) decl.token.throwDebug('export duplicate identifier')
        this.exports.set(decl.token.value,decl.decl)
    }
    hasExport(id:string) {return this.exports.has(id)}

    import(identifier:TokenI): DeclarationWrapper {
        if (!this.exports.has(identifier.value)) identifier.throwDebug('no such exported member')
        return {token:identifier,decl:this.exports.get(identifier.value) as Declaration}
    }

    throwUnexpectedEOF() {
        return (<TokenI>this.tokens.pop()).line.fatal('Unexpected EOF',0,0)
    }

}
