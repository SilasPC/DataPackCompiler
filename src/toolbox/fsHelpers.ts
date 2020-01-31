
import mkdirp from 'mkdirp'
export function MKDIRP(path:string) {
	return new Promise(($,$r)=>{
		mkdirp(path,err=>{
			if (err) $r(err)
			else $()
		})
	})
}

import rimraf from 'rimraf'
export function RIMRAF(path:string) {
	return new Promise(($,$r)=>{
		rimraf(path,{},err=>{
			if (err) $r(err)
			else $()
		})
	})
}
