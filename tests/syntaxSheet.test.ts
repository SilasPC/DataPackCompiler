import { expect } from "chai"
import { SyntaxSheet } from '../src/commands/SyntaxSheet'
import { Token, TokenType } from "../src/lexing/Token"

describe('syntax sheet - syntax verification', () => {

	it('partial matches', () => {
		const ss = SyntaxSheet.fromString(`
t1
  x z
  xy y
  xyz x
  zyx
t2
		`)
		expect(ss.verifySyntax('/t')).to.be.false
		expect(ss.verifySyntax('/t2')).to.be.true
		expect(ss.verifySyntax('/t1')).to.be.false
		expect(ss.verifySyntax('/t1 x z')).to.be.true
		expect(ss.verifySyntax('/t1 xy x')).to.be.false
		expect(ss.verifySyntax('/t1 z')).to.be.true // this test fails
	})

	it('invokation', () => {
		const ss = SyntaxSheet.fromString(`
:world
  world
  universe
hello <:world>
		`)
		expect(ss.verifySyntax('/hello world')).to.be.true
		expect(ss.verifySyntax('/hello universe')).to.be.true
	})

	it('circular invokation', () => {
		const ss = SyntaxSheet.fromString(`
:c
  c <:c>
  e
c <:c>
		`)
		expect(ss.verifySyntax('/c e')).to.be.true
		expect(ss.verifySyntax('/c c e')).to.be.true
		expect(ss.verifySyntax('/c c c e')).to.be.true
		expect(ss.verifySyntax('/c c c c')).to.be.false
	})

	it('optionals', () => {
		const ss = SyntaxSheet.fromString(`
test [opt]
		`)
		expect(ss.verifySyntax('/test')).to.be.true
		expect(ss.verifySyntax('/test nop')).to.be.false
		expect(ss.verifySyntax('/test opt')).to.be.true // this fails
	})

	it('variations', () => {
		const ss = SyntaxSheet.fromString(`
t1|t2 a|b
  x|y
		`)
		expect(ss.verifySyntax('/t1 a x')).to.be.true
		expect(ss.verifySyntax('/t2 a x')).to.be.true
		expect(ss.verifySyntax('/t1 b x')).to.be.true
		expect(ss.verifySyntax('/t2 b x')).to.be.true
		expect(ss.verifySyntax('/t1 a y')).to.be.true
		expect(ss.verifySyntax('/t2 a y')).to.be.true
		expect(ss.verifySyntax('/t1 b y')).to.be.true
		expect(ss.verifySyntax('/t2 b y')).to.be.true
	})
})

describe('syntax sheet - static semantics verification', () => {

})
