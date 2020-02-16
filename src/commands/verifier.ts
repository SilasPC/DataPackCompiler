import { Logger } from "../toolbox/Logger";
import { ParsingFile } from "../toolbox/ParsingFile";
import { mcFnLexer } from "../lexing/funcLexer";
import { allFilesInDir } from "../toolbox/fsHelpers";
import { TokenType } from "../lexing/Token";
import { SyntaxSheet } from "./SyntaxSheet";
import { Maybe, MaybeWrapper } from "../toolbox/Maybe";

export async function verify(path:string,log:Logger,sheet:SyntaxSheet): Promise<Maybe<true>> {
    const maybe = new MaybeWrapper<true>()

    let files = await allFilesInDir(path)
    let fns = files.filter(f=>f.endsWith('.mcfunction'))

    log.logGroup(1,'inf',`Loaded ${fns.length} file${fns.length!=1?'s':''}`)

    let pfiles = await Promise.all(fns.map(fn=>ParsingFile.loadFile(fn)))

    pfiles.forEach(mcFnLexer)

    let errCount = 0

    for (let pfile of pfiles) {
        for (let token of pfile.getTokenIterator()) {
            if (token.type != TokenType.COMMAND)
                throw new Error('got non command token in verifier')
            let res = sheet.verifySyntaxNoSlash(token)
            if (!res) continue
            log.addError(res)
            maybe.noWrap()
            errCount++
        }
    }

    if (errCount)
        log.logGroup(0,'err',`Raised ${errCount} error${errCount!=1?'s':''}`)
    else
        log.log(1,'inf','No errors found')

    return maybe.wrap(true)

}
