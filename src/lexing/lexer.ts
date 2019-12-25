
import { Token, TokenType, SourceLine, TrueToken } from './Token'
import { ParsingFile } from './ParsingFile'
import { exhaust } from '../toolbox/other'
import 'array-flat-polyfill'
import { CompileContext } from '../toolbox/CompileContext'

const keywords = "fn|let|var|break|for|event|while|return|if|else|class|tick|import|const|from|export"
const types = 'int|void|bool'
const comments = "//|/\\*|\\*/"
const operators = "\\+=|-=|\\*=|/=|%=|\\+\\+|\\+|--|-|\\*|/|%|>|<|==|>=|<=|=|!|&&|\\|\\|"
const primitives = "\\d+(?:\\.\\d+)?|true|false|'[^']*'"
const symbol = "[a-zA-Z][a-zA-Z0-9]*"
const markers = ";|:|\\.|,|\\(|\\)|\\[|\\]|\\{|\\}"
const cmd = '/\\w.*?(?=\r?\n)'

function getRgx() {
    return RegExp(
        '(?<cmd>'+    cmd          +')|'+
        '(?<cmt>'+    comments     +')|'+
        '(?<ops>'+    operators    +')|'+
        '(?<kwd>'+  keywords       +')|'+
        '(?<typ>'+  types          +')|'+
        '(?<pri>'+  primitives     +')|'+
        '(?<sym>'+  symbol	       +')|'+
        '(?<mrk>'+    markers	   +')|'+
        '(?<nwl>\n)|(?<bad>\\S)',
        'g'
    )
}

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

export function lexer(pfile:ParsingFile,ctx:CompileContext): void {

    for (let token of baseLex(pfile,pfile.source)) {
        if (!token) throw new Error('wtf')
        pfile.addToken(token)
    }

}

function* baseLex(pfile:ParsingFile,source:string)/*: Generator<TrueToken,void>*/ {

    let linesRaw = source.split('\n')

    let line = new SourceLine(null,pfile,0,linesRaw[0],1)
    let lineComment = false, inlineComment = false
    for (let {group,value,index} of regexLexer(pfile.source)) {
        if (group == 'nwl') {
            let oldLine = line
            line = new SourceLine(line,pfile,index+1,linesRaw[line.nr],line.nr+1)
            oldLine.next = line
            lineComment = false
            continue
        }
        if (group == 'cmt') {
            if (value == '//' && !inlineComment) lineComment = true
            if (value == '/*') inlineComment = true
            if (value == '*/') {
                if (!inlineComment) {
                    return line.fatal('Unmatched',index-line.startIndex,value.length)
                }
                inlineComment = false
            }
            continue
        }
        if (lineComment || inlineComment) continue
        if (group == 'bad') {
            return line.fatal('Invalid token',index-line.startIndex,value.length)
        }
        yield new TrueToken(line,index-line.startIndex,groupToType(group),value)
    }
    return
}

// type LexYield = {group:RgxGroup,value:string,index:number}

function* regexLexer(src:string)/*: Generator<LexYield,void>*/ {

    let match: RegExpExecArray|null
    let rgx = getRgx()
    while (match = rgx.exec(src)) {
        let value = match[0]
        let groups = Object.entries(match.groups||{}).flatMap<string>(([k,v])=>v?k:[])
        if (groups.length != 1) throw new Error('Regex should capture exactly one group')
        let group = groups[0] as RgxGroup
        yield {group,value,index:match.index}
    }

    return

}
