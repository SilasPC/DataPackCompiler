
export interface Errorable {

	warn(error:string,index?:number,length?:number): void
	fatal(error:string,index?:number,length?:number): never

}

export function exhaust(v:never): never {
	throw new Error('Exhaustion failed')
}
