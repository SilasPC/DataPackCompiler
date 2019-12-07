import { ASTCmdNode } from "../AST";
import { Token } from "../../lexing/Token";
import { callbackify } from "util";

Array.prototype.flatMap = function flatMap(this: any, cb:any) {
	return (this as any).map(cb).reduce((acc:any[],v:any)=>acc.concat(v),[] as any[])
} as any

type Tree = Map<string,[string[],Tree_]>
interface Tree_ extends Tree {}

function buildTree(src:string): Tree {

	let lines = src
		.replace(/\r/g,'')
		.split('\n')
		.flatMap((l,i)=>l.trim().length?[{l,i}]:[] as {l:string,i:number}[])

	let tree: Tree = new Map()
	let stack: Tree[] = [tree]
	for (let {l:line,i} of lines) {
		let depth = 1 + (line.length - line.trimStart().length) / 2
		if (!Number.isInteger(depth)) throw new Error('indentation invalid '+(i+1))
		if (depth > stack.length) {
			if (depth > stack.length + 1) throw new Error('over indentation '+(i+1))
			stack.push(tree = new Map())
		} else {
			stack = stack.slice(0,depth)
			tree = stack[stack.length-1]
		}
		let [t,...v] = line.trimStart().split(' ')
		if (v.some(s=>!s.length)) throw new Error('double space '+(i+1))
		if (tree.has(t)) throw new Error('already defined '+(i+1))
		let tree0: Tree = new Map()
		tree.set(t,[v,tree0])
		stack.push(tree0)
	}

	return stack[0]

}

type Def = Map<string,CMDNode[]>

export function parseSheet(src:string) {

	let root = new RootCMDNode('',false,[])
	let def: Def = new Map([['',[root]]])
	root.children.push(...parseTree(buildTree(src),[def]))

	return root

}

function parseTree(tree:Tree,defs:Def[]): CMDNode[] {

	let localDefs: Def = new Map()
	defs = [...defs,localDefs]
	let findDef = (str:string) => defs.flatMap(def=>def.has(str)?[def.get(str)]:[]).pop()

	let ret: CMDNode[] = []
	for (let [key,[vals,children]] of tree) {
		if (key.startsWith(':')) {
			key = key.slice(1)
			if (findDef(key)) throw new Error('redefining :'+key)
			if (vals.length) throw new Error('definition must only have children')
			let defChildren: CMDNode[] = []
			localDefs.set(key,defChildren)
			defChildren.push(...parseTree(children,defs))
			continue
		}
		let nextOpt = vals[0]?vals[0].startsWith('['):false
		let start = key.split('|').map(k=>new CMDNode(k,nextOpt,[]))
		ret.push(...start)
		let last = start
		for (let [i,val] of vals.entries()) {
			let nextOpt = vals[i] ? vals[i].startsWith('[') : false
			if (val.startsWith('[')) {
				val = val.slice(1)
				if (val.endsWith(']')) val.slice(0,-1)
			}
			if (!val.length) {
				if (vals.length - 1 > i) throw new Error('children optional "[" must be last on line')
				break
			}
			let newLast: CMDNode[] = []
			let subs = val.split('|')
			for (let [si,sub] of subs.entries()) {
				let ps = parseSpecial(sub,children,findDef)
				if (ps.sub || ps.spec) {
					sub = (ps.sub || ps.spec) as string
					let subnode = new CMDNode(sub,nextOpt,[])
					newLast.push(subnode)
					for (let n of last) n.children.push(subnode)
				} else if (ps.nodes) {
					for (let n of last) n.children = ps.nodes
					if (subs.length - 1 > si) throw new Error('invokation must be last: '+vals.join(' '))
					newLast = ps.nodes
				} else throw new Error('should not happen')
			}
			last = newLast
		}
		let nextChildren = parseTree(children,defs)
		last.forEach(l=>l.children.push(...nextChildren))
	}

	return ret

}

function parseSpecial(sub:string,children:Tree,findDef:(str:string)=>CMDNode[]|undefined): {spec?:string,nodes?:CMDNode[],sub?:string} {
	if (sub.startsWith('<') && sub.endsWith('>')) {
		let spec = sub.slice(1,-1)
		if (spec.startsWith(':<')) {
			sub = '<' + spec.slice(2) + '>'
			return {sub}
		} else if (spec.startsWith(':')) {
			let nodes = findDef(spec.slice(1))
			if (!nodes) throw new Error('invokatee not defined: '+spec)
			if (children.size) throw new Error('invokation cannot be followed by children: '+sub)
			return {nodes}
		} else if (spec.length) {
			return {spec}
		}
	}
	return {sub}
}

class CMDNode {

	constructor(
		public readonly token: string,
		public readonly restOptional: boolean,
		public children: CMDNode[]
	) {}

	test(cmd:string,i=0): boolean {
		let j = cmd.indexOf(' ',i)
		if (j == -1) j = cmd.length
		if (!this.token.startsWith(cmd.slice(i,j))) return false
		if (cmd.length == j) return this.restOptional || this.children.length == 0
		let [s,...d] = this.children.filter(c=>c.testShallow(cmd,j+1))
		if (d.length) this.children.filter(c=>c.testShallow(cmd,j+1,true)) // try strict equal
		if (d.length) return false // cannot have more than one match
		if (!s) return false
		return s.test(cmd,j+1)
	}

	testShallow(cmd:string,i=0,se=false) {
		if (cmd.length <= i) return this.restOptional
		let x = cmd.slice(i).split(' ')[0]
		return se ? this.token.startsWith(x) : this.token == x
	}

}

class RootCMDNode extends CMDNode {

	test(cmd:string,i=0) {
		let [s,...d] = this.children.filter(c=>c.testShallow(cmd,i))
		if (d.length) return false // cannot have more than one match
		if (!s) return false
		return s.test(cmd,i)
	}

	testShallow() {
		return true
	}

}
