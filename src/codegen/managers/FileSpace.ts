import { getQualifiedName } from "../../toolbox/other"

export interface McFile {
    readonly mcPath: string
}

export class Namespace<T extends McFile> {

    private readonly spaces = new Map<string,Filespace<T>>()

    protected addFile(namespace: string, pathName: readonly string[], file: (fullPath:readonly string[])=>T): T {
        let space = this.spaces.get(namespace)
        if (!space) this.spaces.set(namespace,space = new Filespace())
        return space.addFile(pathName,file)
    }

    protected getFile(namespace: string, pathName: readonly string[]) {
        let space = this.spaces.get(namespace)
        if (!space) return null
        return space.getFile(pathName)
    }

    protected getAllFiles() {
        let ret = new Map<string,T>()
        for (let [name,space] of this.spaces)
            space.getAllInto(name,ret)
        return ret
    }

}

export class Filespace<T extends McFile> {

    private readonly subSpaces = new Map<string,Filespace<T>>()
    private readonly files = new Map<string,T>()

    public getFile(pathNames: readonly string[]): T | null {
        if (pathNames.length > 1) {
            let sub = this.subSpaces.get(pathNames[0])
            if (!sub) return null
            return sub.getFile(pathNames.slice(1))
        }
        return this.files.get(pathNames[0]) || null
    }

    public addFile(pathName: readonly string[], file: (fullPath:readonly string[])=>T): T {
        return this.addFileInternal(pathName.slice(0,-1), pathName,file)
    }

    private addFileInternal(originalPathName: readonly string[], pathName: readonly string[], file: (fullPath:readonly string[])=>T): T {
        if (pathName.length > 1) {
            let sub = this.subSpaces.get(pathName[0])
            if (!sub) this.subSpaces.set(pathName[0],sub = new Filespace())
            return sub.addFileInternal(originalPathName,pathName.slice(1),file)
        }
        let name = getQualifiedName(pathName,this.files,Infinity)
        let f = file(originalPathName.concat(name))
        this.files.set(name,f)
        return f
    }

    public getAllInto(prepend:string,map:Map<string,T>) {
        for (let [name,file] of this.files)
            map.set(`${prepend}/${name}`, file)
        for (let [name,sub] of this.subSpaces)
            sub.getAllInto(`${prepend}/${name}`, map)
    }

}