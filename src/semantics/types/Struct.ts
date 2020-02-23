
import { Type, ValueType } from "./Types"
import { StructDeclaration } from "../declarations/Declaration"
import { Result, ResultWrapper } from "../../toolbox/Result"
import { TokenI } from "../../lexing/Token"
import $ from 'js-itertools'

type Field = {name:string,type:ValueType}

export class Struct {

    static create(name:string,fields:{identifier:TokenI,type:ValueType}[],inheritFrom:{struct:StructDeclaration,identifier:TokenI}[]): Result<Struct,null> {
        const result = new ResultWrapper<Struct,null>()
        let fieldMap = new Map<string,{field:Field,parent:string}>()
        for (let parent of inheritFrom) {
            for (let field of parent.struct.struct.fields) {
                let mapVal = fieldMap.get(field.name)
                if (mapVal)
                    result.addError(parent.identifier.error(`Struct '${mapVal.parent}' also contains field '${field.name}'`))
                else
                    fieldMap.set(field.name,{field,parent:parent.identifier.value})
            }
        }
        let ownFields = new Set<string>()
        for (let field of fields) {

            if (ownFields.has(field.identifier.value))
                result.addError(field.identifier.error(`Duplicate fields`))
            ownFields.add(field.identifier.value)

            let mapVal = fieldMap.get(field.identifier.value)
            if (mapVal)
                result.addError(field.identifier.error(`Struct '${mapVal.parent}' also contains field '${field.identifier.value}'`))
        }
        return result.wrap(new Struct(
            name,
            [...$(fieldMap.values()).map(f=>f.field).chain($(fields).map(f=>({name:f.identifier.value,type:f.type})))],
            inheritFrom.map(p=>p.struct.struct)
        ))
    }

    public readonly type = Type.STRUCT

    private constructor(
        public readonly name: string,
        private readonly fields: readonly Field[],
        private readonly parents: readonly Struct[]
    ) {}

    checkIsSubType(s:Struct): boolean {
        if (this == s) return true
        return this.parents.some(p=>p.checkIsSubType(s))
    }

}