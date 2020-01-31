import { Type } from "./Types"
import { Maybe, MaybeWrapper } from "../../toolbox/Maybe"
import { CompileContext } from "../../toolbox/CompileContext"
import { StructDeclaration } from "../Declaration"
import { Errorable } from "../../toolbox/other"

export class Struct {

    static create(name:string,structs:{struct:StructDeclaration,errOn:Errorable}[],ctx:CompileContext): Maybe<Struct> {
        const maybe = new MaybeWrapper<Struct>()
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