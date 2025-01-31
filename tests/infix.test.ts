
import { expressionSyntaxParser } from "../src/syntax/expressionSyntaxParser";
import { expect } from "chai";
import { lexer } from "../src/lexing/lexer";
import { CompileContext } from "../src/toolbox/CompileContext";
import { ModuleFile } from "../src/input/InputTree";

describe('infix conversion', () => {
	it('left associativity', () => {
		const result = postfix('a+b+c')
		expect(result).to.equal('a b + c +')
	})
	it('right associativity', () => {
		const result = postfix('a=b=c')
		expect(result).to.equal('a b c = =')
	})
	it('list construction', () => {
		const result = postfix('((1,2,3),(4,5))')
		expect(result).to.equal('1 2 3 ,3 4 5 ,2 ,2')
	})
	it('nested invokation', () => {
		const result = postfix('f(g(a,b),h(c,d))')
		expect(result).to.equal('f g a b ,2 $ h c d ,2 $ ,2 $')
	})
	it('functions without arguments', () => {
		const result = postfix('f()+g()')
		expect(result).to.equal('f ,0 $ g ,0 $ +')
	})
	it('function list argument', () => {
		const result = postfix('f((a,b))')
		expect(result).to.equal('f a b ,2 ,1 $')
	})
	it('ridiculous expression', () => {
		const result = postfix('a*--b&&f(2)++,0')
		expect(result).to.equal('a b --:pre * f 2 ,1 $ ++:post && 0 ,2')
	})
	it('unary parsing', () => {
		const result = postfix('--c+-!2')
		expect(result).to.equal('c --:pre 2 !:pre -:pre +')
	})
	it('accessors', () => {
		const result = postfix('a::b::c.d')
		expect(result).to.equal('a b :: c :: d .')
	})
})

function postfix(infix:string): string {
	const file = new ModuleFile('test',infix+';')
	lexer(file)
	const iter = file.getTokenIterator()
	const res = expressionSyntaxParser(
		iter, false
	).meta.postfix.join(' ')
	expect(iter.isDone()).to.be.true
	return res
}
