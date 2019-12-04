"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ParsingFile_1 = require("../src/lexing/ParsingFile");
const expressionSyntaxParser_1 = require("../src/syntax/expressionSyntaxParser");
const chai_1 = require("chai");
const lexer_1 = require("../src/lexing/lexer");
describe('infix conversion', () => {
    it('left associativity', () => {
        const result = postfix('a+b+c');
        chai_1.expect(result).to.equal('a b + c +');
    });
    it('right associativity', () => {
        const result = postfix('a=b=c');
        chai_1.expect(result).to.equal('a b c = =');
    });
    it('list construction', () => {
        const result = postfix('((1,2,3),(4,5))');
        chai_1.expect(result).to.equal('1 2 3 ,3 4 5 ,2 ,2');
    });
    it('nested invokation', () => {
        const result = postfix('f(g(a,b),h(c,d))');
        chai_1.expect(result).to.equal('f g a b ,2 $ h c d ,2 $ ,2 $');
    });
    it('function list argument', () => {
        const result = postfix('f((a,b))');
        chai_1.expect(result).to.equal('f a b ,2 ,1 $');
    });
    it('ridiculous expression', () => {
        const result = postfix('a*--b&&f(2)++,0');
        chai_1.expect(result).to.equal('a b --:pre * f 2 ,1 $ ++:post && 0 ,2');
    });
    it('unary parsing', () => {
        const result = postfix('--c+-!2');
        chai_1.expect(result).to.equal('c --:pre 2 !:pre -:pre +');
    });
});
function postfix(infix) {
    const pfile = ParsingFile_1.ParsingFile.fromSource(infix + ';');
    lexer_1.lexRaw(pfile);
    const iter = pfile.getTokenIterator();
    const res = expressionSyntaxParser_1.expressionSyntaxParser(iter).meta.postfix.join(' ');
    chai_1.expect(iter.isDone()).to.be.true;
    return res;
}
//# sourceMappingURL=infix.test.js.map