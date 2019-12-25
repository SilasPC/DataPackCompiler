
import { Token } from "./Token";
import { ASTNode } from "../syntax/AST";
import { readFileSync } from "fs";
import { resolve, relative, basename } from 'path'
import { SymbolTable } from "../semantics/SymbolTable";
import { TokenIterator } from "./TokenIterator";
import { Declaration } from "../semantics/Declaration";
import { Scope } from "../semantics/Scope";
import { CompileContext } from "../toolbox/CompileContext";

export class ParsingFile {

    static loadFile(path:string,ctx:CompileContext) {
        let fullPath = resolve(path)
        let relativePath = './'+relative('./',fullPath).replace('\\','/').split('.').slice(0,-1).join('.')
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

    private readonly tokens: Token[] = []
    private readonly ast: ASTNode[] = []
    private readonly exports: Map<string,Declaration> = new Map()

    public status: 'lexed'|'parsing'|'parsed'|'generating'|'generated' = 'lexed'

    private constructor(
        public readonly fullPath: string,
        public readonly relativePath: string,
        public readonly source: string,
        public readonly scope: Scope
        
    ) {}
    addToken(t:Token) {this.tokens.push(t)}
    getTokenIterator() {return new TokenIterator(this,this.tokens)}

    addASTNode(n:ASTNode) {this.ast.push(n)}
    getAST() {return this.ast}

    getSymbolTable() {return this.scope.symbols}
    addExport(identifier:string,declaration:Declaration) {
        if (this.exports.has(identifier)) throw new Error('export duplicate identifier')
        this.exports.set(identifier,declaration)
    }

    import(identifier:Token): Declaration {
        if (!this.exports.has(identifier.value)) identifier.throwDebug('no such exported member')
        return this.exports.get(identifier.value) as Declaration
    }

    throwUnexpectedEOF() {
        return (<Token>this.tokens.pop()).fatal('Unexpected EOF')
    }

}
