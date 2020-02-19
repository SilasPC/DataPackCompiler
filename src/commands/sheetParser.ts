
import { promises as fs } from 'fs'
import { dirname } from "path";
import { CMDNode, RootCMDNode, SemanticalCMDNode } from "./CMDNode";
import 'array-flat-polyfill'
import { Result, ResultWrapper, EnsuredResult } from '../toolbox/Result';
import { CompileError } from '../toolbox/CompileErrors';

export class SheetError extends CompileError {
	constructor(msg:string) {
		super(msg)
	}
}

export function fromString(string:string): Result<RootCMDNode,null> {
	const result = new ResultWrapper<RootCMDNode,null>()
	let root = new RootCMDNode('',false,[])
	let def: Def = new Map([['',[root]]])
	let lines = transformString('source',string)
    if (lines.some(l=>l.l.trim().startsWith('@'))) {
        result.addError(new SheetError('no metatags in string sheet'))
        return result.none()
    }
    let tree = buildTree(lines)
    if (result.merge(tree)) return result.none()
    let parsed = parseTree(tree.getValue(),[def])
    result.mergeCheck(parsed)
	root.children.push(...parsed.getEnsured())
	return result.wrap(root)
}

export async function fromSheet(sheet:string): Promise<Result<RootCMDNode,null>> {
    const result = new ResultWrapper<RootCMDNode,null>()
	let root = new RootCMDNode('',false,[])
	let def: Def = new Map([['',[root]]])
    let tree = buildTree(await readSheet('./sheets/'+sheet+'.dplss'))
    if (result.merge(tree)) return result.none()
    let parsed = parseTree(tree.getValue(),[def])
    result.mergeCheck(parsed)
	root.children.push(...parsed.getEnsured())
	return result.wrap(root)
}

// It's actually more an arbitrary directed graph than a tree
type Tree = Map<string,[string[],Tree_]>
interface Tree_ extends Tree {}

type IndexedLines = {f:string,i:number,l:string}[]

function transformString(sourceName:string,source:string): IndexedLines {
	return source
		.replace(/\r/g,'')
		.split('\n')
		.flatMap((l,i)=>{
			let trimmed = l.trim()
			if (!trimmed.startsWith('#') && trimmed.length > 0) {
				return [{f:sourceName,l,i}] as IndexedLines
			}
			return []
		})
}

async function readSheet(file:string): Promise<IndexedLines> {

	let dir = dirname(file)
	let lines = transformString(file,(await fs.readFile(file)).toString())

	let includes: [number,IndexedLines][] = []
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i]
		if (line.l.startsWith('@include')) {
			let files = line.l.split(' ').slice(1)
			for await (let file of files) {
				includes.push([
					i,
					await readSheet(dir+'/'+file+'.dplss')
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

function buildTree(lines:IndexedLines): Result<Tree,null> {	

	const result = new ResultWrapper<Tree,null>()

	let tree: Tree = new Map()
	let stack: Tree[] = [tree]
	for (let {f:file,l:line,i} of lines) {
        // get depth (1 is root, such that stack will never be empty)
		let depth = 1 + (line.length - line.trimStart().length) / 2
		if (!Number.isInteger(depth)) {
            result.addError(new SheetError(`uneven indentation ${i+1}`))
            return result.none()
		}
		if (depth > stack.length) {
			if (depth > stack.length + 1) {
                result.addError(new SheetError('over-indentation '+(i+1)))
                return result.none()
            }
			stack.push(tree = new Map())
		} else {
			stack = stack.slice(0,depth)
			tree = stack[stack.length-1]
        }
        let l = line.trim()
        if (l.startsWith('@')) {
            let [metatag,...r] = l.slice(1).split(' ')
            switch (metatag) {
                case 'warn':
                    result.addWarning(new SheetError(`Syntax sheet warning (${file} : ${i+1}): ${l.slice(6)}`))
                    break
                case 'add': {
                    if (!r.length) {
                        result.addError(new SheetError(`Expected keypath after metatag (${file} : ${i+1})`))
                        return result.none()
                    }
                    let subTree = getSubTree(tree,r)
                    if (!subTree) {
                        result.addError(new SheetError(`Could not find '${r.join(' ')}' in syntax tree (${file} : ${i+1})`))
                        return result.none()
                    }
                    stack.push(tree = subTree)
                    break
                }
                case 'remove': {
                    if (!r.length) {
                        result.addError(new SheetError(`Expected keypath after metatag (${file} : ${i+1})`))
                        return result.none()
                    }
                    let rem = r.pop() as string
                    let subTree = getSubTree(tree,r)
                    if (!subTree||!subTree.has(rem)) {
                        result.addError(new SheetError(`Could not find '${r.join(' ')} ${rem}' in syntax tree (${file} : ${i+1})`))
                        return result.none()
                    }
                    subTree.delete(rem)
                    break
                }
                default:
                    result.addError(new SheetError(`Syntax sheet unknown metatag '${metatag}' (${file} : ${i+1})`))
            }
            continue
        }
		let [t,...v] = line.trimStart().split(' ')
		if (v.some(s=>!s.length)) throw new Error('double space '+(i+1))
		if (tree.has(t)) throw new Error('already defined '+(i+1))
		let tree0: Tree = new Map()
		tree.set(t,[v,tree0])
		stack.push(tree0)
	}

	return result.wrap(stack[0])

}

type Def = Map<string,CMDNode[]>

function parseTree(tree:Tree,defs:Def[]): EnsuredResult<CMDNode[]> {

    const result = new ResultWrapper<null,CMDNode[]>()

	let localDefs: Def = new Map()
	defs = [...defs,localDefs]
	let findDef = (str:string) => defs.flatMap(def=>def.has(str)?[def.get(str)]:[]).pop()

	let ret: CMDNode[] = []
	for (let [mainKey,[keySubs,children]] of tree) {
		if (mainKey.startsWith(':')) {
			mainKey = mainKey.slice(1)
			if (!mainKey.length) {
                result.addError(new SheetError('expected definition name before colon'))
                continue
            }
			if (findDef(mainKey)) {
                result.addError(new SheetError(`redefinition of '${mainKey}'`))
                continue
            }
			if (keySubs.length) {
                result.addError(new SheetError(`definition must not be followed by sub commands, only children`))
            }
			let defChildren: CMDNode[] = []
            localDefs.set(mainKey,defChildren)
            let childRes = parseTree(children,defs)
            result.mergeCheck(childRes)
			defChildren.push(...childRes.getEnsured())
			continue
		}
		let nextOpt = keySubs[0]?keySubs[0].startsWith('['):false
		let start: CMDNode[] = mainKey.split('|').flatMap<CMDNode>((k:string)=>{
            let psRes = parseSpecial(k,children,findDef)
            if (result.merge(psRes)) return []
            let ps = psRes.getValue()
            if (ps.nodes) {
                result.addError(new SheetError('cannot invoke on main key'))
                return []
            }
			if (ps.spec)
				return new SemanticalCMDNode(ps.spec,nextOpt,[])
			if (ps.sub)
				return new CMDNode(k,nextOpt,[])
			throw new Error('exhaustion failure')
		})
		ret.push(...start)
		let last = start
		for (let [i,keySub] of keySubs.entries()) {
			// keySub is the string token of an inline child
			let nextOpt = keySubs[i+1] ? keySubs[i+1].startsWith('[') : false
			if (keySub.startsWith('[')) {
				keySub = keySub.slice(1)
				if (keySub.endsWith(']'))
					keySub = keySub.slice(0,-1)
			}
			if (!keySub.length) {
				// if it is empty, we just removed '[]'
				// this is then an empty rest optional, which must be last
				if (keySubs.length - 1 > i) {
                    result.addError(new SheetError(`children optional '[' must be last in line`))
                    continue
                }
				break
			}
			let newLast: CMDNode[] = []
			let subs = keySub.split('|')
			for (let [si,sub] of subs.entries()) {
				// looping over possible subtokens of inline child
                let psRes = parseSpecial(sub,children,findDef)
                if (result.merge(psRes)) continue
                let ps = psRes.getValue()
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
					if (subs.length - 1 > si) {
                        result.addError(new SheetError(`invokation must be last on line`))
                        continue
                    }
					newLast = ps.nodes
				} else throw new Error('exhaustion failed')
			}
			last = newLast
		}
        let nextChildren = parseTree(children,defs)
        result.mergeCheck(nextChildren)
		last.forEach((l:CMDNode)=>l.children.push(...nextChildren.getEnsured()))
    }

    return result.ensured(ret)

}

function getSubTree(tree:Tree,path:string[]) {
    for (let sub of path) {
        let subTree = tree.get(sub)
        if (subTree) tree = subTree[1]
        else return null
    }
    return tree
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
	'text',
	'id',
	'name',
	'nbt',
	'nbtpath',
	'json',
	'range',
	'block',
	'item'
]
export type SheetSpecials = 'item' | 'block' | 'range' | 'nbtpath' | 'json' | 'nbt' | 'id' | 'name' | 'player' | 'players' | 'entity' | 'entities' | 'pint' | 'uint' | 'int' | 'coords' | 'coords2' | 'float' | 'ufloat' | 'text'

export type Parse = {spec?:string,nodes?:CMDNode[],sub?:string}

function parseSpecial(sub:string,children:Tree,findDef:(str:string)=>CMDNode[]|undefined): Result<Parse,null> {
    const result = new ResultWrapper<Parse,null>()
    if (sub.startsWith('<') && sub.endsWith('>')) {
		let spec = sub.slice(1,-1)
		if (spec.startsWith(':<')) { // escape '<x>' with '<:<x>'
			sub = '<' + spec.slice(2) + '>'
			return result.wrap({sub})
		} else if (spec.startsWith(':')) { // invokation
			let nodes = findDef(spec.slice(1))
			if (!nodes) {
                result.addError(new SheetError(`invokatee '${spec}' not defined`))
                return result.none()
            }
			if (children.size)
                result.addError(new SheetError(`invokation cannot be followed by children`))
			return result.wrap({nodes})
		} else if (spec.length) {
			if (!validSpecials.includes(spec)) {
				// console.warn('ss special not valid:',spec)
				return result.wrap({sub:spec})
			}
			return result.wrap({spec})
		}
	}
	return result.wrap({sub})
}
