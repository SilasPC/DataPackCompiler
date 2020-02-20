import { CompilerOptions, compilerOptionDefaults, WeakCompilerOptions } from "../toolbox/config";
import TOML from '@iarna/toml'

export class Config {

    public static fromTOML(toml:string) {
        return new Config(TOML.parse(toml))
    }

    public static defaultTOML() {
        let def = new Config()
        return TOML.stringify({...def})
    }

    public readonly pack: {
        longName: string
        name: string
        description: string
        namespace: string
        version: string
    }
	public readonly author: {
        name: string
    }
    public readonly convention: {
        generate: boolean
        player: string
        icon: string
    }
	public readonly compilation: CompilerOptions

    constructor(obj?:any) {
        this.pack = {
            longName: str(obj?obj.pack?obj.pack.name:0:0,'My datapack'),
            name: str(obj?obj.pack?obj.pack.name:0:0,'datapack'),
            description: str(obj?obj.pack?obj.pack.description:0:0,'No description available'),
            namespace: str(obj?obj.pack?obj.pack.namespace:0:0,'pack'),
            version: str(obj?obj.pack?obj.pack.version:0:0,'0.1.0')
        }
        this.author = {
            name: str(obj?obj.author?obj.author.name:0:0,'Unknown author')
        }
        this.convention = {
            generate: bool(obj?obj.convention?obj.convention.generate:0:0,true),
            icon: str(obj?obj.convention?obj.convention.icon:0:0,'minecraft:chest'),
            player: str(obj?obj.convention?obj.convention.player:0:0,'Chest') // tmp for icon
        }
        this.compilation = compilerOptionDefaults(obj?obj.compilation:undefined)
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

function bool(val:any,def:boolean): boolean {
    if (typeof val == 'boolean') return val
    return def
}

function purgeKeys<T>(obj:T): T {
	obj = {...obj}
	for (let key in obj)
		if ([null,undefined].includes(obj[key] as any)) delete obj[key]
	return obj
}
