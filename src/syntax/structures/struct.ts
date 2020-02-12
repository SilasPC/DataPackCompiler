
import { ASTNodeType, ASTStructNode } from "../AST"
import { TokenIteratorI } from "../../lexing/TokenIterator"
import { CompileContext } from "../../toolbox/CompileContext"
import { TokenType, GenericToken } from "../../lexing/Token"

export function parseStruct(iter:TokenIteratorI,ctx:CompileContext): ASTStructNode {
    let i = iter.current().indexStart
    let id = iter.next()
    let parents: GenericToken[] = []
    if (id.type != TokenType.SYMBOL) return id.throwDebug('want symbol k')
    if (iter.peek().value == 'implements') {
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
    iter.next().expectValue('}')
    return new ASTStructNode(iter.file,i,id.indexEnd,id,parents)
}
