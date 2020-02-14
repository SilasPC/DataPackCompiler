import { FnFile } from "../FnFile";

export class TagManager {  

    // TODO: obscure names
    // perhaps name generator class instead

    private readonly tags = new Map<string,FnFile[]>()

    public readonly tick = new Set<FnFile>()
    public readonly load = new Set<FnFile>()

    public add(tag:string,fnf:FnFile) {
        if (!this.tags.has(tag)) this.tags.set(tag,[fnf])
        else (this.tags.get(tag) as FnFile[]).push(fnf)
    }

}