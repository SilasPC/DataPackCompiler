
const {promises:fs} = require('fs')
const {join} = require('path')

const counter = /\n/g
let fileCount = 0

recursiveSearch('./src')
	.then(files=>files.filter(f=>f.endsWith('.ts')).map((f,i)=>(fileCount=i,fs.readFile(f))))
	.then(l=>Promise.all(l))
	.then(files=>
		files.map(
			f => (f.toString().match(counter)||[0]).length - 1
		)
		.reduce((s,v)=>s+v,0)
	)
	.then(n=>console.log(`${n} lines over ${fileCount+1} files`))
	.catch(console.trace)
/**/
async function recursiveSearch(path) {
	let files = await fs.readdir(path)
	let stats = await Promise.all(files.map(f=>fs.stat(join(path,f))))
	let dirs = stats
		.map((d,i)=>[d,i])
		.filter(([s])=>s.isDirectory())
		.map(([_,i])=>files[i])
	return files
		.filter(f=>!dirs.includes(f))
		.map(f=>join(path,f))
		.concat(
			(await Promise.all(dirs.map(d=>recursiveSearch(join(path,d)))))
				.reduce((a,c)=>a.concat(c),[])
				.map(v=>v)
		)
}
