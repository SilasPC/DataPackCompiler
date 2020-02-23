
import mkdirp from 'mkdirp'
export function MKDIRP(path:string) {
	return new Promise(($,$r)=>{
		mkdirp(path,err=>{
			if (err) $r(err)
			else $()
		})
	})
}

import rimraf from 'rimraf'
export function RIMRAF(path:string) {
	return new Promise(($,$r)=>{
		rimraf(path,{},err=>{
			if (err) $r(err)
			else $()
		})
	})
}

import { join } from 'path'
import { Stats, promises as fs, constants as FS } from 'fs'
export async function allFilesInDir(path:string): Promise<string[]> {
	let files = await fs.readdir(path)
	let stats = await Promise.all(files.map(f=>fs.stat(join(path,f))))
	let dirs = stats
		.map((d,i)=>([d,i] as [Stats,number]))
		.filter(([s])=>s.isDirectory())
		.map(([_,i])=>files[i])
	return files
		.filter(f=>!dirs.includes(f))
		.map(f=>join(path,f))
		.concat(
			(await Promise.all(dirs.map(d=>allFilesInDir(join(path,d)))))
				.reduce((a,c)=>a.concat(c),[])
				.map(v=>v)
		)
}

export async function createOrLoad(path:string,creator:string|(()=>Promise<string>|string)): Promise<string> {
	try {
		await fs.access(path, FS.F_OK)
		return (await fs.readFile(path)).toString()
	} catch {
		let res = typeof creator == 'string' ? creator : await creator()
		await fs.writeFile(path,res)
		return res
	}
}
