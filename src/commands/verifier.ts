import { Logger } from "../toolbox/Logger";
import { mcFnLexer } from "../lexing/funcLexer";
import { allFilesInDir } from "../toolbox/fsHelpers";
import { TokenType } from "../lexing/Token";
import { SyntaxSheet } from "./SyntaxSheet";
import { EmptyResult, ResultWrapper } from "../toolbox/Result";
import { ModuleFile } from "../input/InputTree";
import { promises as fs } from 'fs'

export async function verify(path:string,log:Logger,sheet:SyntaxSheet): Promise<EmptyResult> {
    const result = new ResultWrapper()

    let files = await allFilesInDir(path)
    let fns = files.filter(f=>f.endsWith('.mcfunction'))

    log.logGroup(1,'inf',`Loaded ${fns.length} file${fns.length!=1?'s':''}`)

    let pfiles = await Promise.all(fns.map(async fn=>new ModuleFile(fn,(await fs.readFile(fn)).toString())))

    pfiles.forEach(mcFnLexer)

    let errCount = 0

    for (let pfile of pfiles) {
        for (let token of pfile.getTokenIterator()) {
            if (token.type != TokenType.COMMAND)
                throw new Error('got non command token in verifier')
            let res = sheet.verifySyntaxNoSlash(token)
            if (!res) continue
            log.addError(res)
            errCount++
        }
    }

    if (errCount)
        log.logGroup(0,'err',`Raised ${errCount} error${errCount!=1?'s':''}`)
    else
        log.log(1,'inf','No errors found')

    return result.empty()

}
