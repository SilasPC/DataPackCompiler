import { OutputManager } from "../codegen/managers/OutputManager";

export function randomMacro(om:OutputManager) {
    const predicates = new Map<number,string>()
    return function random(chance:number): string {
        // pseudo code
        if (predicates.has(chance)) return predicates.get(chance) as string
        let pred = JSON.stringify({
            condition: 'minecraft:random_chance',
            chance
        })
        predicates.set(chance,pred)
        return chance+'.json'
    }
}
