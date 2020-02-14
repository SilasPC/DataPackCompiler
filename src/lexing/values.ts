
// These values are used in lexical analysis and token value exhaustion
// The first is inserted directly as a regex
// Second value is the string sub-type that should be associated

export const keywords: ReadonlyArray<string> = ['pub','implements','struct','recipe','ref','mod','fn','let','var','break','for','event','on','while','return','if','else','class','use','const']
export type Keyword = 'pub' | 'implements' | 'struct' | 'recipe' | 'ref' | 'mod' | 'fn' | 'let' | 'var' | 'break' | 'for' | 'event' | 'on' | 'while' | 'return' | 'if' | 'else' | 'class' | 'use' | 'const'

export const types: ReadonlyArray<string> = ['selector','int','void','bool']
export type Type = 'selector' | 'int' | 'void' | 'bool'

export const reservedSymbols = ['this','super',...keywords,...types]

export const operators = '\\+=|-=|\\*=|/=|%=|\\+\\+|\\+|--|-|\\*|/|%|>|<|==|!=|>=|<=|=|!|&&|\\|\\|'
export type Operator = '!=' | '+=' | '-=' | '*=' | '/=' | '%=' | '++' | '+' | '--' | '-' | '*' | '/' | '%' | '>' | '<' | '==' | '>=' | '<=' | '=' | '!' | '&&' | '||'

export const markers = ";|::|:|\\.|,|\\(|\\)|\\[|\\]|\\{|\\}"
export type Marker = ';' | '::' | ':' | '.' | ',' | '(' | ')' | '[' | ']' | '{' | '}'
