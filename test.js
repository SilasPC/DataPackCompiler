
require('source-map-support').install()

//const { lexer } = require('./out/syntax/lexer.js')
//const { fileSyntaxParser } = require('./out/syntax/fileSyntaxParser')
//const { expressionSyntaxParser } = require('./out/syntax/expressionSyntaxParser')
//const { astParser } = require('./out/semantics/astParser.js')
const { Datapack } = require('./out/codegen/Datapack')
//const { generateCode } = require('./out/codegen/generate')

// let pfile = lexer('./dpsrc/exprtest.txt')
/*let res
try {
  console.log(res=yard(pfile.getTokenIterator()))
} catch (e) {console.error(e)}*/

let dp = new Datapack('./dpsrc','./emit')
// console.log(dp)

dp.compile()
  .then(()=>dp.emit())
  .then(()=>console.log('done!'))
  .catch(e=>{
    console.error(e)
    console.trace()
  })

setInterval(()=>0,1000)
