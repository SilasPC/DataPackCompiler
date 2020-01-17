import { expect } from "chai"
import { SyntaxSheet } from '../src/commands/SyntaxSheet'
import { Token, TokenType } from "../src/lexing/Token"
import { ParsingFile } from "../src/toolbox/ParsingFile"
import { CompileContext } from "../src/toolbox/CompileContext"
import { Datapack } from "../src/codegen/Datapack"
import { compilerOptionDefaults } from "../src/toolbox/config"
import { lexer } from "../src/lexing/lexer"

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
		const ss = SyntaxSheet.fromString(`
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
		const ss = SyntaxSheet.fromString(`
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
		const ss = SyntaxSheet.fromString(`
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
		const ss = SyntaxSheet.fromString(`
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

function readSyntax(source:string,ss:SyntaxSheet) {
	const ctx = new CompileContext(compilerOptionDefaults(),ss)
	let pfile = ctx.loadFromSource(source,'test')
	lexer(pfile,ctx)
	let res: boolean[] = []
	for (let token of pfile.getTokenIterator()) {
		if (token.type == TokenType.COMMAND) {
			let maybe = ss.readSyntax(token,ctx)
			if (maybe.value) res.push(true)
			else res.push(false)
		}
	}
	return res
}
