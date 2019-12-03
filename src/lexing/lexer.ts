
import { Token, TokenType, SourceLine } from './Token'
import { ParsingFile } from './ParsingFile'

const keywords = "fn|let|var|break|for|event|while|return|if|else|class|tick|import|const|from|export"
const types = 'int|void'
const comments = "//|/\\*|\\*/"
const operators = "\\+=|-=|\\*=|/=|%=|\\+\\+|\\+|--|-|\\*|/|%|>|<|==|>=|<=|=|!|&&|\\|\\|"
const primitives = "\\d+(?:\\.\\d+)?|true|false"
const symbol = "[a-zA-Z][a-zA-Z0-9]*"
const markers = ";|:|\\.|,|\\(|\\)|\\[|\\]|\\{|\\}"
const cmd = '/\\w.*?(?=\r?\n)'

const regex = RegExp(
    '('+    cmd         +')|'+ // 1
    '('+    comments	+')|'+ // 2
    '('+    operators	+')|'+ // 3
    '\b('+    keywords	+')\b|'+ // 4
    '\b('+    types 	+')\b|'+ // 5
    '('+    symbol		+')|'+ // 6
    '('+    primitives	+')|'+ // 7
    '('+    markers		+')|(\n)|(\\S)', // 8, 9, 10

    'g'
)

function groupIndexToType(i:number): TokenType|ControlLexemes {
    switch (i) {
        case 1: return TokenType.COMMAND
        case 2: return ControlLexemes.COMMENTS
        case 3: return TokenType.OPERATOR
        case 4: return TokenType.KEYWORD
        case 5: return TokenType.TYPE
        case 6: return TokenType.SYMBOL
        case 7: return TokenType.PRIMITIVE
        case 8: return TokenType.MARKER
        case 9: return ControlLexemes.NEW_LINE
        case 10: return ControlLexemes.WHITE_SPACE
        default: throw console.error(i)
    }
}

enum ControlLexemes {
    COMMENTS = 'COMMENT',
    NEW_LINE = 'NEW_LINE',
    WHITE_SPACE = 'WHITE_SPACE'
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
        let tt = groupIndexToType(match.indexOf(t,1))
        if (tt == ControlLexemes.NEW_LINE) {
            let oldLine = line
            line = new SourceLine(line,pfile,match.index+1,linesRaw[line.nr],line.nr+1)
            oldLine.next = line
            lineComment = false
            continue
        }
        if (lineComment) continue
        if (tt == ControlLexemes.WHITE_SPACE) throw console.error(tt,line,match)
        if (tt == ControlLexemes.COMMENTS) {
            if (t == '//') lineComment = true
            if (t == '/*') inlineComment = true
            if (t == '*/') {
                if (!inlineComment) throw console.error(tt,line,match)
                inlineComment = false
            }
            continue
        }
        if (inlineComment) continue
        pfile.addToken(new Token(line,match.index-line.startIndex,tt,t))
    }
    if (inlineComment) throw 'unexpected end of input in inline comment'

    return pfile

}
