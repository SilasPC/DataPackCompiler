import { Type } from "./Types"

export class Struct {

    public readonly type = Type.STRUCT

    private parents: Struct[] = []

    constructor() {}

    checkIsSubType(s:Struct): boolean {
        if (this == s) return true
        return this.parents.some(p=>p.checkIsSubType(s))
    }

}