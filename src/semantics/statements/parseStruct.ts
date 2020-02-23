import { ASTStructNode } from "../../syntax/AST";
import { Scope } from "../Scope";
import { StructDeclaration, DeclarationType, Declaration } from "../declarations/Declaration";
import { Struct } from "../types/Struct";
import { GenericToken, TokenI } from "../../lexing/Token";
import { Result, ResultWrapper, SuccededResult } from "../../toolbox/Result";
import { ValueType, tokenToType } from "../types/Types";

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
                return [] as {struct:StructDeclaration,identifier:GenericToken}[]
            }
            return {struct:w,identifier:p.token}
        })
    let fields: {identifier:TokenI,type:ValueType}[] = []
    for (let [dirs,field] of node.body.iterate()) {
        let type = tokenToType(field.fieldType,scope.symbols)
        if (dirs.length) result.addWarning(dirs[0].error('directives not supported in structs yet'))
        fields.push({identifier:field.identifier,type})
    }
    let struct = Struct.create(node.identifier.value,fields,parents)
    if (result.merge(struct)) return result.none()
    return result.wrap({
        type: DeclarationType.STRUCT,
        struct: struct.getValue(),
        namePath:scope.getScopeNames()
    })
}