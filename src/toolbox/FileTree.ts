import { ParsingFile } from "./ParsingFile";
import { join, basename } from "path";
import { Stats, promises as fs } from 'fs'

export interface FileTree {
    self: ParsingFile | null
    children: Map<string,FileTree>
}

export function allParsingFiles(ft:FileTree,res:ParsingFile[] = []): ParsingFile[] {
    if (ft.self) res.push(ft.self)
    for (let child of ft.children.values())
        allParsingFiles(child,res)
    return res
}

export async function loadFileTree(path:string) {
    return await loadChildren(path,null)
}

async function loadChildren(path:string,self:ParsingFile|null): Promise<FileTree> {
    let files = await fs.readdir(path)
    let stats = await Promise.all(files.map(f=>fs.stat(join(path,f))))
    
	let dirs = stats
		.map((d,i)=>([d,i] as [Stats,number]))
		.filter(([s])=>s.isDirectory())
        .map(([_,i])=>files[i])

    let children = new Map<string,FileTree>()

    for (let file of files) {
        if (dirs.includes(file)) continue
        if (!file.endsWith('.dpl')) continue
        children.set(
            basename(file,'.dpl'),
            {
                self: await ParsingFile.loadFile(join(path,file)),
                children: new Map()
            }
        )
    }

    for (let dir of dirs) {
        children.set(
            dir,
            await loadChildren(join(path,dir),null)
        )
    }
    
    return {
        self,
        children
    }
    
}
