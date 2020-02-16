
import { Type } from "./Types"
import { StructDeclaration } from "../declarations/Declaration"
import { Errorable } from "../../toolbox/other"
import { Result, ResultWrapper } from "../../toolbox/Result"

export class Struct {

    static create(name:string,structs:{struct:StructDeclaration,errOn:Errorable}[]): Result<Struct,null> {
        const maybe = new ResultWrapper<Struct,null>()
        if (structs.length == 0) return maybe.wrap(new Struct(name,[]))
        return maybe.wrap(new Struct(name,structs.map(s=>s.struct.struct)))
    }

    public readonly type = Type.STRUCT

    private constructor(
        public readonly name: string,
        private readonly parents: Struct[]
    ) {}

    checkIsSubType(s:Struct): boolean {
        if (this == s) return true
        return this.parents.some(p=>p.checkIsSubType(s))
    }

}