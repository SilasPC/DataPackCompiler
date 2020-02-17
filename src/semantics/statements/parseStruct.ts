import { ASTStructNode } from "../../syntax/AST";
import { Scope } from "../Scope";
import { CompileContext } from "../../toolbox/CompileContext";
import { StructDeclaration, DeclarationType, Declaration } from "../declarations/Declaration";
import { Struct } from "../types/Struct";
import { GenericToken } from "../../lexing/Token";
import { Result, ResultWrapper, SuccededResult } from "../../toolbox/Result";

export function parseStruct(node:ASTStructNode,scope:Scope): Result<StructDeclaration,null> {
    const result = new ResultWrapper<StructDeclaration,null>()
    let parents = node.parents
        .map(token=>({token,decl:scope.symbols.getDeclaration(token)}))
        .filter(
            (p:{
                token:GenericToken,
                decl:Result<Declaration,null>
            }): p is {
                token:GenericToken,
                decl:SuccededResult<Declaration,null>
            } => !result.merge(p.decl))
        .flatMap(p=>{
            let w = p.decl.getValue()
            if (w.type != DeclarationType.STRUCT) {
                result.addError(p.token.error('not a struct'))
                return [] as {struct:StructDeclaration,errOn:GenericToken}[]
            }
            return {struct:w,errOn:p.token}
        })
    let struct = Struct.create(node.identifier.value,parents)
    if (result.merge(struct)) return result.none()
    return result.wrap({
        type: DeclarationType.STRUCT,
        struct: struct.getValue(),
        namePath:scope.getScopeNames()
    })
}