import { TokenI } from "../lexing/Token"
import { parseJSONInline } from "../toolbox/other"

export function readScore(token:TokenI,i:number): number | string {
	let x = readSelector(token,i,true,false,true)
	if (typeof x == 'string') return x
	let y = readId(token,i+x,false)
	if (typeof y == 'string') return y
	return x + y
}

const rangeRgx = /(?<min>-?\d*(\.\d+)?)(?:\.\.(?<max>-?\d*(\.\d+)?))?(?<sep> )?/y
export function readRange(token:TokenI,i:number): number | string {
	rangeRgx.lastIndex = i
	let res = rangeRgx.exec(token.value)
	if (!res) return 'expected range'
	if (!res.groups || (!res.groups.sep && token.value.length > i + res[0].length))
		return 'expected seperator'
	if (res.groups.min && res.groups.max) {
		if (Number(res.groups.min) > Number(res.groups.max)) return 'maximum is smaller than minimum'
	}
	return res[0].length
}

const nbtRgx = /[a-zA-Z0-9](\.[a-zA-Z0-9]+|\[-?\d+\])*(?<sep> )?/y
export function readNbtPath(token:TokenI,i:number): number | string {
	nbtRgx.lastIndex = i
	let res = nbtRgx.exec(token.value)
	if (!res) return 'expected nbt path'
	if (!res.groups || (!res.groups.sep && token.value.length > i + res[0].length))
		return 'expected seperator'
	return res[0].length
}

const sepRgx = /(?<sep> )?/y
export function readJSON(token:TokenI,i:number): number | string {
	let res = parseJSONInline(token.value.slice(i))
	if (res.errIndex != -1) return `malformed json (index ${res.errIndex})`
	sepRgx.lastIndex = i + res.read
	let sepRes = sepRgx.exec(token.value)
	if (
		!sepRes ||
		!sepRes.groups ||
		(!sepRes.groups.sep && token.value.length > i + res.read + sepRes[0].length)
	) return 'expected seperator'
	return res.read + sepRes[0].length
}

const coordsRgx = /(?:~|(?<l1>\^)|)(?:-?\d+(?:\.\d+)?|(?<=\^|~)) (?:~|(?<l2>\^)|)(?:-?\d+(?:\.\d+)?|(?<=\^|~)) (?:~|(?<l3>\^)|)(?:-?\d+(?:\.\d+)?|(?<=\^|~))(?<sep> |$)?/y
export function readCoords(
	token:TokenI,
	i:number
): number | string {
	coordsRgx.lastIndex = i
	let res = coordsRgx.exec(token.value)
	if (!res) return 'expected three valid coordinates'
	if (!res.groups || (!res.groups.sep && token.value.length > i + res[0].length))
		return 'expected seperator'
	if (
		res.groups['l1'] != res.groups['l2'] ||
		res.groups['l2'] != res.groups['l3']
	) return 'cannot mix world space and local coordinates'
	return res[0].length
}

const coords2Rgx = /(?:~|(?<l1>\^)|)(?:-?\d+(?:\.\d+)?|(?<=\^|~)) (?:~|(?<l2>\^)|)(?:-?\d+(?:\.\d+)?|(?<=\^|~))(?<sep> |$)?/y
export function read2Coords(
	token:TokenI,
	i:number
): number | string {
	coords2Rgx.lastIndex = i
	let res = coords2Rgx.exec(token.value)
	if (!res) return 'expected two valid coordinates'
	if (!res.groups || (!res.groups.sep && token.value.length > i + res[0].length))
		return 'expected seperator'
	if (res.groups['l1'] || res.groups['l2']) return 'cannot use local coordinates'
	return res[0].length
}

const timeRgx = /\d+(?:\.\d+)?[dst]?(?<sep> |$)?/y
export function readTime(
	token:TokenI,
	i:number
): number | string {
	timeRgx.lastIndex = i
	let res = numRgx.exec(token.value)
	if (!res)
		return 'expected time'
	if (!res.groups || (!res.groups.sep && token.value.length > i + res[0].length))
		return 'expected seperator'
	return res[0].length
}

const numRgx = /(?<b10>-?\d+(?:\.\d+)?)(?<sep> |$)?/y
export function readNumber(
	token:TokenI,
	integer:boolean,
	negative:boolean,
	zero:boolean,
	i:number
): number | string {
	numRgx.lastIndex = i
	let res = numRgx.exec(token.value)
	if (!res)
		return 'expected number'
	if (!res.groups || (!res.groups.sep && token.value.length > i + res[0].length))
		return 'expected seperator'
	if (res.groups['b10']) {
		let num = Number(res.groups['b10'])
		if (Number.isNaN(num))
			throw new Error('NaN in number regex')
		if (integer && !Number.isInteger(num))
			return 'expected integer'
		if (!negative && num <= 0) {
			if (!zero)
				return 'expected positive'
			if (!negative && num < 0) {
				return 'expected non-negative'
			}
		}
		return res[0].length
	} else throw new Error('not implemented other than base 10 nums')
}

const idRgx = /(?<ns>[a-z0-9.-_]+:)?([a-zA-Z0-9.-_]+)(\/([a-zA-Z0-9.-_]+))*(?<sep> |$)?/y
export function readId(
	token:TokenI,
	i:number,
	allowNamespace:boolean
): number | string {
	idRgx.lastIndex = i
	let res = idRgx.exec(token.value)
	if (!res) return 'expected valid id'
	if (!res.groups || (!res.groups.sep && token.value.length > i + res[0].length))
		return 'expected seperator'
	if (res.groups.ns && !allowNamespace)
		return 'unexpected namespace'
	return res[0].length
}

const selRgx = /@(?<typ>[apser])(?:(?!\[)|(?:\[[^\]\s]*?\]))(?<sep> |$)?/y // improve and fix this
export function readSelector(
	token:TokenI,
	i:number,
	multiple:boolean,
	playerOnly:boolean,
	allowId:boolean
): number | string {
	selRgx.lastIndex = i
	let res = selRgx.exec(token.value)
	if (!res) {
		if (!allowId) return 'expected selector'
		let idRes = readId(token,i,false)
		if (typeof idRes == 'number') return idRes
		return 'expected selector'
	}
	if (!res.groups || (!res.groups.sep && token.value.length > i + res[0].length))
		return 'expected seperator'
	if (!multiple && 'ae'.includes(res.groups['typ']))
		return 'only singular selector'
	if (playerOnly && 'es'.includes(res.groups['typ']))
		return 'only players'
	return res[0].length
}
