import { Logger } from "../toolbox/Logger"
import { DirectiveToken } from "../lexing/Token"
import $ from 'js-itertools'

export type Directive = 'tick' | 'load' | 'inline' | 'debug' | 'todo'
export const directives = ['tick','load','inline','debug','todo']

export type DirectiveList = {value:Directive,token:DirectiveToken}[]

export function checkDebugIgnore(dirs:DirectiveList,debugBuild:boolean) {
	for (let dir of dirs) {
		if (dir.value == 'debug' && !debugBuild) return true
	}
	return false
}

export function listDirectives(dirs:readonly DirectiveToken[],log:Logger): DirectiveList {
    // dedupe
    let map = new Map<string,DirectiveToken>()
	for (let dir of dirs) {
		let val = dir.value.slice(2,-1).trim()
		if (map.has(val)) log.addWarning(dir.error('duplicate directive'))
		else map.set(val,dir)
    }
    // list
    return [
        ...$(map)
            .filter(([v,t])=>{
                let included = directives.includes(v)
                if (!included) log.addWarning(t.error('unknown directive')) // when implementing Result, this will error instead
                return included
            })
            .map(([value,token])=>({value:value as Directive,token}))
    ]
}
