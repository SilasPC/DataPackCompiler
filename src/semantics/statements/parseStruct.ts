import { ASTStructNode } from "../../syntax/AST";
import { Scope } from "../Scope";
import { CompileContext } from "../../toolbox/CompileContext";
import { Declaration, StructDeclaration, DeclarationType, DeclarationWrapper } from "../Declaration";
import { Maybe, MaybeWrapper } from "../../toolbox/Maybe";
import { Struct } from "../types/Struct";
import { TokenI, GenericToken } from "../../lexing/Token";

export function parseStruct(node:ASTStructNode,scope:Scope,ctx:CompileContext): Maybe<StructDeclaration> {
    const maybe = new MaybeWrapper<StructDeclaration>()
    let parents = node.parents
        .map(token=>({token,decl:scope.symbols.getDeclaration(token,ctx.logger)}))
        .filter(p=>!maybe.merge(p.decl))
        .flatMap(p=>{
            let w = p.decl.value as DeclarationWrapper
            if (w.decl.type != DeclarationType.STRUCT) {
                ctx.logger.addError(p.token.error('not a struct'))
                maybe.noWrap()
                return [] as {struct:StructDeclaration,errOn:GenericToken}[]
            }
            return {struct:w.decl,errOn:p.token}
        })
    return maybe.map<Struct,StructDeclaration>(Struct.create(node.identifier.value,parents,ctx),struct=>({type:DeclarationType.STRUCT,struct,namePath:scope.getScopeNames()}))
}