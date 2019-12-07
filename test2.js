
const { parseSheet } = require('./out/syntax/commands/validateCommand')
const { promises: fs } = require('fs')

fs.readFile('./src/syntax/commands/syntaxsheet.txt')
.then(String)
.then(parseSheet)
.then(n=>{
	console.log(n)
	console.log(n.test(''),0)
	console.log(n.test('bossbar'),0)
	console.log(n.test('bossbar list'),1)
	console.log(n.test('bossbar add'),0)
	console.log(n.test('bossbar get id value'),1)
	console.log(n.test('advancement revoke player from id'),1)
})
.catch(e=>console.error(e))

setInterval(()=>0,1000)
