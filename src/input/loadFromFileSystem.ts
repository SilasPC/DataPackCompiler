
import { InputTree, ModuleFile } from "./InputTree"
import { promises as fs, Stats } from 'fs'
import { join, extname, basename, relative } from "path"
import { ResultWrapper, Result, EnsuredResult } from "../toolbox/Result"
import { CompileError } from "../toolbox/CompileErrors"

export async function loadDirectory(originPath:string,path:string): Promise<EnsuredResult<InputTree>> {
    const result = new ResultWrapper<InputTree,InputTree>()
    let tree = new InputTree(null)
    result.merge(await loadChildren(originPath,path,tree))
    return result.ensured(tree)
}

async function loadChildren(originPath:string,path:string,tree:InputTree): Promise<Result<null,null>> {

    const result = new ResultWrapper<null,null>()

    let files = await fs.readdir(path)
    let stats = await Promise.all(files.map(f=>fs.stat(join(path,f))))
    
	let dirs = stats
		.map((d,i)=>([d,i] as [Stats,number]))
		.filter(([s])=>s.isDirectory())
        .map(([_,i])=>files[i])

    for (let file of files) {
        if (dirs.includes(file)) continue

        let name = basename(file)
        let fullPath = join(path,file)
        let relPath = relative(originPath,fullPath)
        let ext = extname(file)

        if (!['.dpl'].includes(ext)) continue // ignore all files other than the given ones

        if (tree.modules.has(name)) {
            result.addError(new CompileError(`Module ${relPath} already exists`))
            continue
        }
        if (tree.others.has(name)) {
            result.addError(new CompileError(`File ${relPath} already exists`))
            continue
        }
        if (!name.match(/^[a-zA-Z][a-zA-Z-0-9]*/)) {
            result.addError(new CompileError(`File ${relPath} has an invalid name`))
            continue
        }

        switch (ext) {
            case '.dpl':
                if (name == 'mod') {
                    if (tree.module) {
                        result.addWarning(new CompileError(`Module ${relPath} already exists (${tree.module.displayName})`))
                        continue
                    }
                    tree.module = new ModuleFile(
                        relPath,
                        (await fs.readFile(fullPath)).toString()
                    )
                    continue
                }
                tree.modules.set(
                    basename(file,'.dpl'),
                    new InputTree(
                        new ModuleFile(
                            relPath,
                            (await fs.readFile(fullPath)).toString()
                        )
                    )
                    
                )
            default:
                continue;
        }
        
    }

    for (let dir of dirs) {
        
        let fullPath = join(path,dir)
        let relPath = relative(originPath,fullPath)

        let sub: InputTree = tree.modules.get(dir) || new InputTree(null)
        if (!dir.match(/^[a-zA-Z][a-zA-Z-0-9]*/)) {
            result.addError(new CompileError(`Folder ${relPath} has an invalid name`))
            continue
        }
        if (!tree.modules.has(dir))
            tree.modules.set(dir,sub)

        result.merge(await loadChildren(originPath,fullPath,sub))
        
    }

    return result.wrap(null)
    
}