import { ASTStructNode } from "../../syntax/AST";
import { Scope } from "../Scope";
import { CompileContext } from "../../toolbox/CompileContext";
import { Declaration, StructDeclaration, DeclarationType, DeclarationWrapper } from "../declarations/Declaration";
import { Struct } from "../types/Struct";
import { TokenI, GenericToken } from "../../lexing/Token";
import { Result, ResultWrapper } from "../../toolbox/Result";

export function parseStruct(node:ASTStructNode,scope:Scope,ctx:CompileContext): Result<StructDeclaration,null> {
    const result = new ResultWrapper<StructDeclaration,null>()
    let parents = node.parents
        .map(token=>({token,decl:scope.symbols.getDeclaration(token,ctx.logger)}))
        .filter(p=>!result.merge(p.decl))
        .flatMap(p=>{
            let w = p.decl.getValue() as DeclarationWrapper
            if (w.decl.type != DeclarationType.STRUCT) {
                ctx.logger.addError(p.token.error('not a struct'))
                return [] as {struct:StructDeclaration,errOn:GenericToken}[]
            }
            return {struct:w.decl,errOn:p.token}
        })
    let struct = Struct.create(node.identifier.value,parents)
    if (result.merge(struct)) return result.none()
    return result.wrap({
        type: DeclarationType.STRUCT,
        struct: struct.getValue(),
        namePath:scope.getScopeNames()
    })
}