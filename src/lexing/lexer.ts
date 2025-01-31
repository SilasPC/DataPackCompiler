
import { TokenI, TokenType, Token } from './Token'
import { exhaust } from '../toolbox/other'
import 'array-flat-polyfill'
import { LiveIterator } from './TokenIterator'
import { SourceLine } from './SourceLine'
import { operators, keywords, markers, types } from './values'
import { ModuleFile } from '../input/InputTree'
import { EnsuredResult, EmptyResult, ResultWrapper } from '../toolbox/Result'

const comments = "//|/\\*|\\*/"
const primitives = "\\d+(?:\\.\\d+)?|true|false|'[^']*'"
const symbol = "[a-zA-Z_][a-zA-Z0-9_]*"
const cmd = '/\\w.*?(?=\r?\n)'
const selector = '@\\w|@(?=\\[)'
const directive = '#\\[[^\\]]+\\]'

function getRgx() {
    return RegExp(
        '(?<dir>'+  directive            +')|'+
        '(?<cmd>'+  cmd                  +')|'+
        '(?<cmt>'+  comments             +')|'+
        '(?<ops>'+  operators            +')|'+
        '(?<kwd>'+  keywords.join('|')   +`)(?![a-zA-Z0-9])|`+
        '(?<typ>'+  types.join('|')      +')(?![a-zA-Z0-9])|'+
        '(?<pri>'+  primitives           +')|'+
        '(?<sym>'+  symbol	             +')|'+
        '(?<mrk>'+  markers 	         +')|'+
        '(?<sel>'+  selector             +')|'+
        '(?<nwl>\n)|(?<bad>\\S)',
        'g'
    )
}

type RgxGroup = 'dir'|'cmd'|'cmt'|'ops'|'kwd'|'typ'|'pri'|'sym'|'mrk'|'nwl'|'bad'|'sel'

function groupToType(g:Exclude<RgxGroup,'cmt'|'nwl'|'bad'>): TokenType {
    switch (g) {
        case 'dir': return TokenType.DIRECTIVE
        case 'cmd': return TokenType.COMMAND
        case 'ops': return TokenType.OPERATOR
        case 'kwd': return TokenType.KEYWORD
        case 'typ': return TokenType.TYPE
        case 'pri': return TokenType.PRIMITIVE
        case 'sym': return TokenType.SYMBOL
        case 'mrk': return TokenType.MARKER
        case 'sel': return TokenType.SELECTOR
        default:
            return exhaust(g)
    }
}

export function lexer(file:ModuleFile) {

    for (let token of baseLex(file,file.source)) {
        if (!token) throw new Error('wtf')
        file.addToken(token)
    }

}

export function inlineLiveLexer(pfile:ModuleFile,token:TokenI,offset:number) {
    return new LiveIterator(pfile,inlineLexer(token.line,token.indexLine+offset))
}

function* inlineLexer(line:SourceLine,offset:number)/*: Generator<Token,void>*/ {
    
    let inlineComment = false
    for (let {group,value,index} of regexLexer(line.line.slice(offset))) {
        if (group == 'nwl') throw new Error('got newline inside source line in inline lexical generator')
        if (group == 'bad')
            return line.fatal(`Invalid token '${value}'`,index,value.length)
        if (group == 'cmt') {
            if (value == '//') return
            if (value == '/*') inlineComment = true
            if (value == '*/') {
                if (!inlineComment) {
                    return line.fatal('Unmatched',index+offset,value.length)
                }
                inlineComment = false
            }
            continue
        }
        yield Token.create(line,index+offset,groupToType(group),value)
    }
    return
}

function* baseLex(pfile:ModuleFile,source:string)/*: Generator<Token,void>*/ {

    let linesRaw = source.split('\n')

    let line = new SourceLine(null,pfile,0,linesRaw[0],1)
    pfile.addLine(line)
    let lineComment = false, inlineComment = false
    for (let {group,value,index} of regexLexer(source)) {
        if (group == 'nwl') {
            let oldLine = line
            line = new SourceLine(line,pfile,index+1,linesRaw[line.nr],line.nr+1)
            pfile.addLine(line)
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
        yield Token.create(line,index-line.startIndex,groupToType(group),value)
    }
    return
}

type LexYield = {group:RgxGroup,value:string,index:number}

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
