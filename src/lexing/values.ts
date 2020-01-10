
// These values are used in lexical analysis and token value exhaustion
// The first is inserted directly as a regex
// Second value is the string sub-type that should be associated

export const keywords = ['ref','namespace','fn','let','var','break','for','event','while','return','if','else','class','tick','import','const','from','export']
export type Keyword = 'ref' | 'namespace' | 'fn' | 'let' | 'var' | 'break' | 'for' | 'event' | 'while' | 'return' | 'if' | 'else' | 'class' | 'tick' | 'import' | 'const' | 'from' | 'export'

// todo
const reserved = 'this'
type Reserved = 'this'

export const types = ['int','void','bool"']
export type Type = 'int' | 'void' | 'bool'

export const operators = '\\+=|-=|\\*=|/=|%=|\\+\\+|\\+|--|-|\\*|/|%|>|<|==|>=|<=|=|!|&&|\\|\\|'
export type Operator = '+=' | '-=' | '*=' | '/=' | '%=' | '++' | '+' | '--' | '-' | '*' | '/' | '%' | '>' | '<' | '==' | '>=' | '<=' | '=' | '!' | '&&' | '||'

export const markers = ";|::|:|\\.|,|\\(|\\)|\\[|\\]|\\{|\\}"
export type Marker = ';' | '::' | ':' | '.' | ',' | '(' | ')' | '[' | ']' | '{' | '}'
