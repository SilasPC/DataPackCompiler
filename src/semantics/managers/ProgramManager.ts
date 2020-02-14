
import { HoistingMaster, UnreadableHoistingMaster } from "./HoistingMaster";
import { ModDeclaration, EventDeclaration } from "../declarations/Declaration";
import { FunctionStore } from "./FunctionStore";

export interface Program {
    readonly fnStore: FunctionStore
    readonly hoisting: UnreadableHoistingMaster
    setEventToTick(e:EventDeclaration): void
    setEventToLoad(e:EventDeclaration): void
}

export class ProgramManager implements Program {

    public readonly fnStore = new FunctionStore()
    public readonly rootModule: ModDeclaration = ModDeclaration.createRoot(this)
    public readonly hoisting = new HoistingMaster()

    public readonly tickEvents = new Set<EventDeclaration>()
    public readonly loadEvents = new Set<EventDeclaration>()

    setEventToTick(e:EventDeclaration) {
        this.tickEvents.add(e)
    }
    setEventToLoad(e:EventDeclaration) {
        this.loadEvents.add(e)
    }

}
