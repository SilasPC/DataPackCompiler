import { expect } from "chai"
import { SyntaxSheet } from '../src/commands/SyntaxSheet'
import { TokenType } from "../src/lexing/Token"
import { CompileContext } from "../src/toolbox/CompileContext"
import { compilerOptionDefaults } from "../src/toolbox/config"
import { lexer } from "../src/lexing/lexer"
import { ResultWrapper } from "../src/toolbox/Result"
import { Logger } from "../src/toolbox/Logger"
import { ModuleFile } from "../src/input/InputTree"

describe('syntax sheet - syntax verification', () => {

	/*it('partial matches', () => {
		const ss = SyntaxSheet.fromString(`
t1
  x z
  xy y
  xyz x
  zyx
t2
		`)
		let t = readSyntax(`
			/t
			/t2
			/t1
			/t1 x z
			/t1 xy x
			/t1 z
		`,ss)
		expect(t[0]).to.be.false
		expect(t[1]).to.be.true
		expect(t[2]).to.be.false
		expect(t[3]).to.be.true
		expect(t[4]).to.be.false
		expect(t[5]).to.be.true // this test fails
	})*/

	it('invokation', () => {
		const ss = getSheet(`
:world
  world
  universe
hello <:world>
		`)
		let t = readSyntax(`
			/hello world
			/hello universe
		`,ss)
		expect(t[0]).to.be.true
		expect(t[1]).to.be.true
	})

	it('circular invokation', () => {
		const ss = getSheet(`
:c
  c <:c>
  e
c <:c>
		`)
		let t = readSyntax(`
			/c e
			/c c e
			/c c c e
			/c c c c
		`,ss)
		expect(t[0]).to.be.true
		expect(t[1]).to.be.true
		expect(t[2]).to.be.true
		expect(t[3]).to.be.false
	})

	it('optionals', () => {
		const ss = getSheet(`
test [opt]
		`)
		let t = readSyntax(`
			/test
			/test nop
			/test opt
		`,ss)
		expect(t[0]).to.be.true
		expect(t[1]).to.be.false
		expect(t[2]).to.be.true // this fails
	})

	it('variations', () => {
		const ss = getSheet(`
t1|t2 a|b
  x|y
		`)
		let t = readSyntax(`
			/t1 a x
			/t2 a x
			/t1 b x
			/t2 b x
			/t1 a y
			/t2 a y
			/t1 b y
			/t2 b y
		`,ss)
		expect(t[0]).to.be.true
		expect(t[1]).to.be.true
		expect(t[2]).to.be.true
		expect(t[3]).to.be.true
		expect(t[4]).to.be.true
		expect(t[5]).to.be.true
		expect(t[6]).to.be.true
		expect(t[7]).to.be.true
	})
})

describe('syntax sheet - static semantics verification', () => {

})

function getSheet(source:string) {
	const result = new ResultWrapper()
	let ss = SyntaxSheet.fromString(source)
	if (result.merge(ss)) throw result.getErrors().values().next().value
	return ss.getValue()
}

function readSyntax(source:string,ss:SyntaxSheet) {
	const result = new ResultWrapper()
	const file = new ModuleFile('test',source)
	lexer(file)
	let ret: boolean[] = []
	for (let token of file.getTokenIterator()) {
		if (token.type == TokenType.COMMAND) {
			let res = ss.readSyntax(token)
			if (result.merge(res)) ret.push(false)
			else ret.push(true)
		} else throw new Error('expected cmds only in test')
	}
	return ret
}
