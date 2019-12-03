"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const Token_1 = require("./toolbox/Token");
const ParsingFile_1 = require("./toolbox/ParsingFile");
const path = __importStar(require("path"));
const keywords = "fn|let|var|break|for|event|while|return|if|else|class|tick|import|const|from|export";
const comments = "//|/\\*|\\*/";
const operators = "\\+=|-=|\\*=|/=|%=|\\+\\+|\\+|--|-|\\*|/|%|>|<|==|>=|<=|=|!|&&|\\|\\|";
const primitives = "\\d+(?:\\.\\d+)?|true|false";
const symbol = "[a-zA-Z][a-zA-Z0-9]*";
const markers = ";|:|\\.|,|\\(|\\)|\\[|\\]|\\{|\\}";
const cmd = '/\\w.*?(?=\r?\n)';
const regex = RegExp('(' + cmd + ')|' + // 1
    '(' + comments + ')|' + // 2
    '(' + operators + ')|' + // 3
    '(' + keywords + ')|' + // 4
    '(' + symbol + ')|' + // 5
    '(' + primitives + ')|' + // 6
    '(' + markers + ')|(\n)|(\\S)', // 7, 8, 9
'g');
function groupIndexToType(i) {
    switch (i) {
        case 1: return Token_1.TokenType.COMMAND;
        case 3: return Token_1.TokenType.OPERATOR;
        case 4: return Token_1.TokenType.KEYWORD;
        case 5: return Token_1.TokenType.SYMBOL;
        case 6: return Token_1.TokenType.PRIMITIVE;
        case 7: return Token_1.TokenType.MARKER;
        default: throw console.error(i);
    }
}
function lexer(file) {
    let str = fs_1.readFileSync(file).toString();
    let pfile = new ParsingFile_1.ParsingFile(path.resolve(file), './' + path.relative('./', file).replace('\\', '/').split('.').slice(0, -1).join('.'));
    console.log(pfile);
    let linesRaw = str.split('\n');
    regex.lastIndex = 0;
    let line = new Token_1.SourceLine(null, pfile, 0, linesRaw[0], 1);
    let match;
    let lineComment = false, inlineComment = false;
    while (match = regex.exec(str)) {
        match.index;
        let t = match[0];
        let ti = match.indexOf(t, 1);
        if (ti == 0)
            throw console.error(ti, line, match);
        if (ti == 9)
            throw console.error(ti, line, match);
        if (ti == 8) {
            let oldLine = line;
            line = new Token_1.SourceLine(line, pfile, match.index + 1, linesRaw[line.nr], line.nr + 1);
            oldLine.next = line;
            lineComment = false;
            continue;
        }
        if (lineComment)
            continue;
        if (ti == 2) {
            if (t == '//')
                lineComment = true;
            if (t == '/*')
                inlineComment = true;
            if (t == '*/') {
                if (!inlineComment)
                    throw console.error(ti, line, match);
                inlineComment = false;
            }
            continue;
        }
        if (inlineComment)
            continue;
        pfile.addToken(new Token_1.Token(line, match.index - line.startIndex, groupIndexToType(ti), t));
    }
    if (inlineComment)
        throw 'unexpected end of line inline comment';
    return pfile;
}
exports.lexer = lexer;
//# sourceMappingURL=Lexer.js.map