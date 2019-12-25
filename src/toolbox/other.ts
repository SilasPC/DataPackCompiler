
export interface Errorable {

	warn(error:string,index?:number,length?:number): void
	fatal(error:string,index?:number,length?:number): never

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

export function getQualifiedName(names:string[],vals:Collection<string>,maxLength:number) {
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
