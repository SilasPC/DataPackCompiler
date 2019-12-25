"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("./Token");
const other_1 = require("../toolbox/other");
require("array-flat-polyfill");
const keywords = "fn|let|var|break|for|event|while|return|if|else|class|tick|import|const|from|export";
const types = 'int|void|bool';
const comments = "//|/\\*|\\*/";
const operators = "\\+=|-=|\\*=|/=|%=|\\+\\+|\\+|--|-|\\*|/|%|>|<|==|>=|<=|=|!|&&|\\|\\|";
const primitives = "\\d+(?:\\.\\d+)?|true|false|'[^']*'";
const symbol = "[a-zA-Z][a-zA-Z0-9]*";
const markers = ";|:|\\.|,|\\(|\\)|\\[|\\]|\\{|\\}";
const cmd = '/\\w.*?(?=\r?\n)';
function getRgx() {
    return RegExp('(?<cmd>' + cmd + ')|' +
        '(?<cmt>' + comments + ')|' +
        '(?<ops>' + operators + ')|' +
        '(?<kwd>' + keywords + ')|' +
        '(?<typ>' + types + ')|' +
        '(?<pri>' + primitives + ')|' +
        '(?<sym>' + symbol + ')|' +
        '(?<mrk>' + markers + ')|' +
        '(?<nwl>\n)|(?<bad>\\S)', 'g');
}
function groupToType(g) {
    switch (g) {
        case 'cmd': return Token_1.TokenType.COMMAND;
        case 'ops': return Token_1.TokenType.OPERATOR;
        case 'kwd': return Token_1.TokenType.KEYWORD;
        case 'typ': return Token_1.TokenType.TYPE;
        case 'pri': return Token_1.TokenType.PRIMITIVE;
        case 'sym': return Token_1.TokenType.SYMBOL;
        case 'mrk': return Token_1.TokenType.MARKER;
        default:
            return other_1.exhaust(g);
    }
}
function lexer(pfile, ctx) {
    for (let token of baseLex(pfile, pfile.source)) {
        if (!token)
            throw new Error('wtf');
        pfile.addToken(token);
    }
}
exports.lexer = lexer;
function* baseLex(pfile, source) {
    let linesRaw = source.split('\n');
    let line = new Token_1.SourceLine(null, pfile, 0, linesRaw[0], 1);
    let lineComment = false, inlineComment = false;
    for (let { group, value, index } of regexLexer(pfile.source)) {
        if (group == 'nwl') {
            let oldLine = line;
            line = new Token_1.SourceLine(line, pfile, index + 1, linesRaw[line.nr], line.nr + 1);
            oldLine.next = line;
            lineComment = false;
            continue;
        }
        if (group == 'cmt') {
            if (value == '//' && !inlineComment)
                lineComment = true;
            if (value == '/*')
                inlineComment = true;
            if (value == '*/') {
                if (!inlineComment) {
                    return line.fatal('Unmatched', index - line.startIndex, value.length);
                }
                inlineComment = false;
            }
            continue;
        }
        if (lineComment || inlineComment)
            continue;
        if (group == 'bad') {
            return line.fatal('Invalid token', index - line.startIndex, value.length);
        }
        yield new Token_1.TrueToken(line, index - line.startIndex, groupToType(group), value);
    }
    return;
}
// type LexYield = {group:RgxGroup,value:string,index:number}
function* regexLexer(src) {
    let match;
    let rgx = getRgx();
    while (match = rgx.exec(src)) {
        let value = match[0];
        let groups = Object.entries(match.groups || {}).flatMap(([k, v]) => v ? k : []);
        if (groups.length != 1)
            throw new Error('Regex should capture exactly one group');
        let group = groups[0];
        yield { group, value, index: match.index };
    }
    return;
}
//# sourceMappingURL=lexer.js.map