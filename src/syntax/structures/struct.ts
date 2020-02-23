
import { ASTNodeType, ASTStructNode, ASTFieldNode, ASTStaticFieldDeclaration, ASTStaticFieldBody } from "../AST"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { TokenType, GenericToken, DirectiveToken, TokenI } from "../../lexing/Token"
import { tokenToType } from "../../semantics/types/Types"
import { Interspercer } from "../../toolbox/Interspercer"

export function parseStruct(iter:TokenIteratorI): ASTStructNode {
    let i = iter.current().indexStart
    let id = iter.next()
    let parents: GenericToken[] = []
    if (id.type != TokenType.SYMBOL) return id.throwDebug('want symbol k')
    if (iter.peek().value == 'extends') {
        iter.skip(1)
        while (true) {
            let sym = iter.peek()
            if (sym.type != TokenType.SYMBOL) break
            parents.push(sym)
            if (iter.skip(1).peek().value != ',') break
            iter.skip(1)
        }
        if (parents.length == 0) iter.peek().throwDebug('expected identifier')
    }
    iter.next().expectValue('{')
    let fields = parseStructBody(iter)
    return new ASTStructNode(iter.file,i,id.indexEnd,id,parents,fields)
}

function parseStructBody(iter:TokenIteratorI): ASTStaticFieldBody {
    let body: ASTStaticFieldBody = new Interspercer()
    for (let token of iter) {
        if (token.value == '}') return body
        
        if (token.type == TokenType.DIRECTIVE) {
            body.addSubData(token)
            continue
        }

        let isPub: TokenI | null = null
        if (token.value == 'pub') {
            isPub = token
            token = iter.next()
        }
        let identifier = token.expectType(TokenType.SYMBOL)
        iter.next().expectValue(':') // no methods for now
        let type = iter.next().expectType(/*TokenType.SYMBOL,*/TokenType.TYPE)
        body.add(new ASTFieldNode(iter.file,isPub?isPub.indexStart:identifier.indexStart,type.indexEnd,!!isPub,identifier,type))

    }
    return iter.file.throwUnexpectedEOF()
}
