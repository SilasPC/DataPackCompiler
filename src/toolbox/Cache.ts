
type Data = {[key:string]:{stamp:string,value:any}|{cache:Data}}

export interface DataCacheI {
	branch(id:string): DataCacheI
	getOrSet<T>(id:string,stamp:string,f:()=>Promise<T>): Promise<T>
}

export class DataCache {

	public static fromRaw(json:string) {
		return new DataCache(JSON.parse(json))
	}

	public static empty() {
		return new DataCache({})
	}

	private constructor(
		private readonly data: Data
	) {}
	
	public getRaw() {
		return JSON.stringify(this.data)
	}

	branch(id:string): DataCacheI {
		if (id in this.data) {
			let data = this.data[id]
			if (!('cache' in data)) throw new Error(`Cache id '${id}' matches data, not subcache`)
			return new DataCache(data.cache)
		}
		let cache = {}
		this.data[id] = {cache}
		return new DataCache(cache)
	}

	async getOrSet<T>(id:string,stamp:string,f:()=>Promise<T>): Promise<T> {
		if (id in this.data) {
			let data = this.data[id]
			if ('cache' in data) throw new Error(`Cache id '${id}' matches subcache, not data`)
			if (data.stamp == stamp) return data.value
			data.stamp = stamp
			return data.value = await f()
		}
		let {value} = this.data[id] = {
			stamp,
			value: await f()
		}
		return value
	}

}
