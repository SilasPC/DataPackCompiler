import { Config } from "../../api/Configuration"
import { getObscureName, getQualifiedName } from "../../toolbox/other"
import { IChainableIterable } from "js-itertools/lib/src/types"
import $ from 'js-itertools'

export class MiscFile {

	constructor(
		public readonly mcPath: string,
		public readonly realPath: string,
		public readonly realName: string,
		public readonly content: string
	) {}

}

const types = {
	advancements: 'json'
}

export class MiscManager {

	private readonly files = new Map<string,Map<string,MiscFile>>()

	constructor(
		private readonly cfg: Config
	) {}

	createDefault(type:keyof typeof types,namePath:readonly string[],content:string) {
		return this.create(this.cfg.pack.namespace,type,namePath,content)
	}

	createAbsoluteUnsafe(namespace:string,type:keyof typeof types,name:string,content:string): MiscFile {
		let ns: Map<string,MiscFile> | undefined = this.files.get(namespace)
		if (!ns) ns = new Map()
		if (ns.has(name)) throw new Error('misc file already exists')
		let mf = new MiscFile(
			`${namespace}:${name}`,
			`${namespace}/${type}`,
			`${name}.${types[type]}`,
			content
		)
		ns.set(name,mf)
		return mf
	}

	create(namespace:string,type:keyof typeof types,namePath:readonly string[],content:string): MiscFile {
		let ns: Map<string,MiscFile> | undefined = this.files.get(namespace)
		if (!ns) ns = new Map()
		let name: string
		if (this.cfg.compilation.obscureNames)
			name = getObscureName(ns)
		else
			name = getQualifiedName(namePath,ns,Infinity)
		let mf = new MiscFile(
			`${namespace}:${name}`,
			`${namespace}/${type}`,
			`${name}.${types[type]}`,
			content
		)
		ns.set(name,mf)
		return mf
	}

	all() {return $(this.files.values()).flatMap(x=>x.values())}

}