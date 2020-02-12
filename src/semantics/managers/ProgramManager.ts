
import { HoistingMaster, UnreadableHoistingMaster } from "./HoistingMaster";
import { ParseTreeStore } from "../ParseTree";
import { Logger } from "../../toolbox/Logger";
import { ModDeclaration } from "../declarations/Declaration";
import { Maybe, MaybeWrapper } from "../../toolbox/Maybe";
import { TokenI } from "../../lexing/Token";
import { Scope } from "../Scope";

export interface Program extends UnreadableHoistingMaster {
    readonly parseTree: ParseTreeStore
}

export class ProgramManager extends HoistingMaster implements Program {

    public readonly parseTree = new ParseTreeStore()

    public readonly rootModule: ModDeclaration
    
    constructor(
    ) {
        super()
        this.rootModule = ModDeclaration.createRoot(this)
    }

}
