
import { ParsingFile } from "../lexing/ParsingFile";
import { TokenType } from "../lexing/Token";
import { parseFunction } from "./structures/function";
import { wrapExport } from "./helpers";
import { SyntaxParser } from "./SyntaxParser";
import { parseDeclaration } from "./structures/declaration";

const parser: SyntaxParser<ParsingFile> = new SyntaxParser('file')

parser
    .usingType(TokenType.KEYWORD)
    .case('fn',(iter,pfile)=>{
        pfile.addASTNode(wrapExport(parseFunction(iter),false)) // do export thing
    })
    .case('let',(iter,pfile)=>{
        pfile.addASTNode(wrapExport(parseDeclaration(iter),false))
    })

export function fileSyntaxParser(pfile: ParsingFile) {

    parser.consume(pfile.getTokenIterator(),pfile)

    //if (shouldExport) pfile.throwUnexpectedEOF();

}

