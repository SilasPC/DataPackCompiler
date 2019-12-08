
import { Token, TokenType, SourceLine } from './Token'
import { ParsingFile } from './ParsingFile'
import { exhaust } from '../toolbox/other'
import 'array-flat-polyfill'

const keywords = "fn|let|var|break|for|event|while|return|if|else|class|tick|import|const|from|export"
const types = 'int|void|bool'
const comments = "//|/\\*|\\*/"
const operators = "\\+=|-=|\\*=|/=|%=|\\+\\+|\\+|--|-|\\*|/|%|>|<|==|>=|<=|=|!|&&|\\|\\|"
const primitives = "\\d+(?:\\.\\d+)?|true|false"
const symbol = "[a-zA-Z][a-zA-Z0-9]*"
const markers = ";|:|\\.|,|\\(|\\)|\\[|\\]|\\{|\\}"
const cmd = '/\\w.*?(?=\r?\n)'

const regex = RegExp(
    '(?<cmd>'+    cmd          +')|'+   // 1
    '(?<cmt>'+    comments     +')|'+   // 2
    '(?<ops>'+    operators    +')|'+   // 3
    '(?<kwd>'+  keywords       +')|'+ // 4
    '(?<typ>'+  types          +')|'+ // 5
    '(?<pri>'+  primitives     +')|'+ // 6
    '(?<sym>'+  symbol	     +')|'+ // 7
    '(?<mrk>'+    markers	     +')|'+   // 8
    '(?<nwl>\n)|(?<bad>\\S)', // 9, 10
    'g'
)

type RgxGroup = 'cmd'|'cmt'|'ops'|'kwd'|'typ'|'pri'|'sym'|'mrk'|'nwl'|'bad'

function groupToType(g:Exclude<RgxGroup,'cmt'|'nwl'|'bad'>): TokenType {
    switch (g) {
        case 'cmd': return TokenType.COMMAND
        case 'ops': return TokenType.OPERATOR
        case 'kwd': return TokenType.KEYWORD
        case 'typ': return TokenType.TYPE
        case 'pri': return TokenType.PRIMITIVE
        case 'sym': return TokenType.SYMBOL
        case 'mrk': return TokenType.MARKER
        default:
            return exhaust(g)
    }
}

export function lexer(file:string): ParsingFile {
    return lexRaw(ParsingFile.loadFile(file))
}

export function lexRaw(pfile:ParsingFile): ParsingFile {

    let linesRaw = pfile.source.split('\n')

    regex.lastIndex = 0
    let line = new SourceLine(null,pfile,0,linesRaw[0],1)
    let match
    let lineComment = false, inlineComment = false
    while (match = regex.exec(pfile.source)) {
        match.index
        let t = match[0]
        let groups = Object.entries(match.groups||{}).flatMap<string>(([k,v])=>v?k:[])
        if (groups.length != 1) throw new Error('Regex should capture exactly one group')
        let g = groups[0] as RgxGroup
        if (g == 'nwl') {
            let oldLine = line
            line = new SourceLine(line,pfile,match.index+1,linesRaw[line.nr],line.nr+1)
            oldLine.next = line
            lineComment = false
            continue
        }
        if (lineComment) continue
        if (g == 'bad') {
            return line.fatal('Invalid token',match.index-line.startIndex,t.length)
        }
        if (g == 'cmt') {
            if (t == '//') lineComment = true
            if (t == '/*') inlineComment = true
            if (t == '*/') {
                if (!inlineComment) {
                    return line.fatal('Unmatched',match.index-line.startIndex,t.length)
                }
                inlineComment = false
            }
            continue
        }
        if (inlineComment) continue
        pfile.addToken(new Token(line,match.index-line.startIndex,groupToType(g),t))
    }
    if (inlineComment) line.fatal('Unexpected EOF')

    return pfile

}
