
import { promises as fs } from 'fs'
import { dirname } from "path";
import { CMDNode, RootCMDNode, SemanticalCMDNode } from "./CMDNode";
import 'array-flat-polyfill'

export function fromString(string:string): RootCMDNode {
	let root = new RootCMDNode('',false,[])
	let def: Def = new Map([['',[root]]])
	let lines = transformString(string)
	if (lines.some(l=>l.l.startsWith('@include'))) throw new Error('no includes in string sheet')
	root.children.push(...parseTree(buildTree(transformString(string)),[def]))
	return root
}

export async function fromSheet(sheet:string): Promise<RootCMDNode> {
	let root = new RootCMDNode('',false,[])
	let def: Def = new Map([['',[root]]])
	root.children.push(...parseTree(buildTree(await readSheet('./sheets/'+sheet+'.txt')),[def]))
	return root
}

// It's actually more an arbitrary directed graph than a tree
type Tree = Map<string,[string[],Tree_]>
interface Tree_ extends Tree {}

type IndexedLines = {i:number,l:string}[]

function transformString(source:string): IndexedLines {
	return source
		.replace(/\r/g,'')
		.split('\n')
		.flatMap((l,i)=>!l.startsWith('#')&&l.trim().length?[{l,i}]:[] as {l:string,i:number}[])
}

async function readSheet(file:string): Promise<IndexedLines> {

	let dir = dirname(file)
	let lines = transformString((await fs.readFile(file)).toString())

	let includes: [number,{l:string,i:number}[]][] = []
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i]
		if (line.l.startsWith('@include')) {
			let files = line.l.split(' ').slice(1)
			for await (let file of files) {
				includes.push([
					i,
					await readSheet(dir+'/'+file+'.txt')
				])
			}
		}
	}
	
	for (let [index,ins] of includes.reverse()) {
		if (!lines[index].l.startsWith('@include')) throw new Error('include error?')
		lines.splice(index,1,...ins)
	}

	return lines

}

function buildTree(lines:IndexedLines): Tree {	

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

function parseTree(tree:Tree,defs:Def[]): CMDNode[] {

	let localDefs: Def = new Map()
	defs = [...defs,localDefs]
	let findDef = (str:string) => defs.flatMap(def=>def.has(str)?[def.get(str)]:[]).pop()

	let ret: CMDNode[] = []
	for (let [key,[vals,children]] of tree) {
		if (key.startsWith(':')) {
			key = key.slice(1)
			if (!key.length) throw new Error('expected definition name')
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
				if (ps.spec) {
					let subnode = new SemanticalCMDNode(ps.spec,nextOpt,[])
					newLast.push(subnode)
					for (let n of last) n.children.push(subnode)
				} else if (ps.sub) {
					let subnode = new CMDNode(ps.sub,nextOpt,[])
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

const validSpecials = [
	'player',
	'players',
	'entity',
	'entities',
	'pint',
	'uint',
	'int',
	'coords',
	'coords2',
	'float',
	'ufloat',
	'text'
]
export type SheetSpecials = 'player' | 'players' | 'entity' | 'entities' | 'pint' | 'uint' | 'int' | 'coords' | 'coords2' | 'float' | 'ufloat' | 'text'

function parseSpecial(sub:string,children:Tree,findDef:(str:string)=>CMDNode[]|undefined): {spec?:string,nodes?:CMDNode[],sub?:string} {
	if (sub.startsWith('<') && sub.endsWith('>')) {
		let spec = sub.slice(1,-1)
		if (spec.startsWith(':<')) { // escape '<x>' with '<:<x>'
			sub = '<' + spec.slice(2) + '>'
			return {sub}
		} else if (spec.startsWith(':')) { // invokation
			let nodes = findDef(spec.slice(1))
			if (!nodes) throw new Error('invokatee not defined: '+spec)
			if (children.size) throw new Error('invokation cannot be followed by children: '+sub)
			return {nodes}
		} else if (spec.length) {
			if (!validSpecials.includes(spec)) {
				console.warn('ss special not valid:',spec)
				return {sub:spec}
			}
			return {spec}
		}
	}
	return {sub}
}
