
// These values are used in lexical analysis and token value exhaustion
// The first is inserted directly as a regex
// Second value is the string sub-type that should be associated

export const keywords: ReadonlyArray<string> = ['implements','struct','recipe','ref','namespace','fn','let','var','break','for','event','while','return','if','else','class','tick','import','const','from','export']
export type Keyword = 'implements' | 'struct' | 'recipe' | 'ref' | 'namespace' | 'fn' | 'let' | 'var' | 'break' | 'for' | 'event' | 'while' | 'return' | 'if' | 'else' | 'class' | 'tick' | 'import' | 'const' | 'from' | 'export'

export const types: ReadonlyArray<string> = ['selector','int','void','bool"']
export type Type = 'selector' | 'int' | 'void' | 'bool'

export const reservedSymbols = ['this',...keywords,...types]

export const operators = '\\+=|-=|\\*=|/=|%=|\\+\\+|\\+|--|-|\\*|/|%|>|<|==|!=|>=|<=|=|!|&&|\\|\\|'
export type Operator = '!=' | '+=' | '-=' | '*=' | '/=' | '%=' | '++' | '+' | '--' | '-' | '*' | '/' | '%' | '>' | '<' | '==' | '>=' | '<=' | '=' | '!' | '&&' | '||'

export const markers = ";|::|:|\\.|,|\\(|\\)|\\[|\\]|\\{|\\}"
export type Marker = ';' | '::' | ':' | '.' | ',' | '(' | ')' | '[' | ']' | '{' | '}'
