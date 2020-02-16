
import { SourceLine } from "./SourceLine"
import { Token, TokenType } from "./Token"
import { ModuleFile } from "../input/InputTree"

function getRgx() {
    return /^\s(?<cmt>[^#\n])$/gm
}

export function mcFnLexer(pfile:ModuleFile)/*: Generator<Token,void>*/ {

    let linesRaw = pfile.source.split('\n')
    let match: RegExpExecArray|null
    let rgx = getRgx()
    let line: SourceLine | null = null
    while (match = rgx.exec(pfile.source)) {
        let lastLineNr: number = line ? line.nr : 0
        line = new SourceLine(line,pfile,0,linesRaw[lastLineNr],lastLineNr+1)
        pfile.addLine(line)
        if (!match.groups || !match.groups.cmt) {
            pfile.addToken(Token.create(line,0,TokenType.COMMAND,match[0].trimLeft()))
        }
    }

}
