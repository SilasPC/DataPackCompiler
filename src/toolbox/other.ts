import { CompileError } from "./CompileErrors"

export interface Errorable {
	error(err:string): CompileError
}

export function assertDefined<T>(v:T|undefined): T {
	if (v == undefined) throw new Error('Assertion failed')
	return v
}

export function exhaust(v:never): never {
	throw new Error('Exhaustion failed')
}

interface Collection<T> {
	has(v:T): boolean
}

export function getObscureName(vals:Collection<string>) {
	while (true) {
		let name = Math.random().toString(16).substr(2,8)
		if (!vals.has(name)) return name
	}
}

export function getQualifiedName(names:ReadonlyArray<string>,vals:Collection<string>,maxLength:number) {
	let name = names.join('_')
	if (name.length > maxLength) {
		name = name.replace(/[aeyuio]/g,'')
		names = names.slice(-maxLength)
	}
	if (!vals.has(name)) return name
	let nr = 1
	while (true) {
		let name2 = name + nr++
		if (name2.length > maxLength) name2 = name2.slice(-maxLength)
		if (!vals.has(name2)) return name2
	}
}

export function purgeNullishKeys<P,T extends P>(obj:T): P {
	obj = {...obj}
	for (let key in obj)
		if ([null,undefined].includes(obj[key] as any)) delete obj[key]
	return obj
}

export function parseJSONInline(json:string): {read:number,res:any,errIndex:number} {

	try {
		let res = JSON.parse(json)
		return {read:json.length,res,errIndex:-1}
	} catch (e) {
		let pos = e.toString().match(/\d+/)
		if (!pos) return {read:0,res:null,errIndex:0}
		let i = parseInt(pos[0],10)
		try {
			let res = JSON.parse(json.slice(0,i))
			return {read:i,res,errIndex:-1}
		} catch {
			return {read:0,res:null,errIndex:i-1}
		}
	}

}
