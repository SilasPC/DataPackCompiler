import { CompilerOptions, compilerOptionDefaults, WeakCompilerOptions } from "../toolbox/config";
import { promises as fs } from 'fs'
import TOML from '@iarna/toml'

export class Config {

    public static async fromTOMLFile(file:string) {
        return new Config(TOML.parse((await fs.readFile(file)).toString()))
    }

    public static async writeDefaultToTOMLFile(file:string) {
        let def = new Config()
        await fs.writeFile(file,TOML.stringify({...def}))
    }

    public readonly pack: {
        longName: string
        name: string
        description: string
        namespace: string
        icon: string
    }
	public readonly author: {
        name: string
        player: string
    }
	public readonly compilation: CompilerOptions

    constructor(obj?:any) {
        this.pack = {
            longName: str(obj?obj.pack?obj.pack.name:0:0,'My datapack'),
            name: str(obj?obj.pack?obj.pack.name:0:0,'datapack'),
            description: str(obj?obj.pack?obj.pack.description:0:0,'No description available'),
            namespace: str(obj?obj.pack?obj.pack.namespace:0:0,'pack'),
            icon: str(obj?obj.pack?obj.pack.icon:0:0,'minecraft:chest')
        }
        this.author = {
            name: str(obj?obj.author?obj.author.name:0:0,'Unknown author'),
            player: str(obj?obj.author?obj.author.player:0:0,'Chest') // tmp for icon
        }
        this.compilation = compilerOptionDefaults(obj?obj.compilation:undefined)
        Object.freeze(this)
    }

    overrideCompilerOptions(cfg:WeakCompilerOptions) {
        return new Config({
            ...this,
            compilation: {
                ...this.compilation,
                ...purgeKeys(cfg)
            }
        })
    }

}

function str(val:any,def:string): string {
    if (typeof val != 'string' || val.length == 0) return def
    return val
}

function purgeKeys<T>(obj:T): T {
	obj = {...obj}
	for (let key in obj)
		if ([null,undefined].includes(obj[key] as any)) delete obj[key]
	return obj
}
