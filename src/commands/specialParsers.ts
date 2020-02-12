import { TokenI } from "../lexing/Token"

const coordsRgx = /^(?:~|(?<l1>\^)|)(?:-?\d+(?:\.\d+)?|(?<=\^|~)) (?:~|(?<l2>\^)|)(?:-?\d+(?:\.\d+)?|(?<=\^|~)) (?:~|(?<l3>\^)|)(?:-?\d+(?:\.\d+)?|(?<=\^|~))(?<sep> |$)?/g
export function readCoords(
	token:TokenI,
	i:number
): number | string {
	coordsRgx.lastIndex = 0
	let res = coordsRgx.exec(token.value.slice(i))
	if (!res) return 'expected three valid coordinates'
	if (!res.groups || !('sep' in res.groups)) return 'expected seperator'
	if (
		res.groups['l1'] != res.groups['l2'] ||
		res.groups['l2'] != res.groups['l3']
	) return 'cannot mix world space and local coordinates'
	return res[0].length
}

const coords2Rgx = /^(?:~|(?<l1>\^)|)(?:-?\d+(?:\.\d+)?|(?<=\^|~)) (?:~|(?<l2>\^)|)(?:-?\d+(?:\.\d+)?|(?<=\^|~))(?<sep> |$)?/g
export function read2Coords(
	token:TokenI,
	i:number
): number | string {
	coords2Rgx.lastIndex = 0
	let res = coords2Rgx.exec(token.value.slice(i))
	if (!res) return 'expected two valid coordinates'
	if (!res.groups || !('sep' in res.groups)) return 'expected seperator'
	if (res.groups['l1'] || res.groups['l2']) return 'cannot use local coordinates'
	return res[0].length
}

const numRgx = /^(?<b10>-?\d+(?:\.\d+)?)(?<sep> |$)?/g
export function readNumber(
	token:TokenI,
	integer:boolean,
	negative:boolean,
	zero:boolean,
	i:number
): number | string {
	numRgx.lastIndex = 0
	let res = numRgx.exec(token.value.slice(i))
	if (!res)
		return 'expected number'
	if (!res.groups || !('sep' in res.groups))
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

const idRgx = /^(?:[a-zA-Z0-9.-_]+:)?[a-zA-Z0-9.-_]+(?<sep> |$)?/g
export function readId(
	token:TokenI,
	i:number
): number | string {
	idRgx.lastIndex = 0
	let res = idRgx.exec(token.value.slice(i))
	if (!res) return 'expected valid id'
	if (!res.groups || !('sep' in res.groups))
		return 'expected seperator'
	return res[0].length
}

const selRgx = /^@(?<typ>[apser])(?:(?!\[)|(?:\[[^\]\s]*?\]))(?<sep> |$)?/g // improve and fix this
export function readSelector(
	token:TokenI,
	i:number,
	multiple:boolean,
	playerOnly:boolean
): number | string {
	selRgx.lastIndex = 0
	let res = selRgx.exec(token.value.slice(i))
	if (!res)
		return 'expected selector'
	if (!res.groups || !('sep' in res.groups))
		return 'expected seperator'
	if (!multiple && 'ae'.includes(res.groups['typ']))
		return 'only singular selector'
	if (playerOnly && 'es'.includes(res.groups['typ']))
		return 'only players'
	return res[0].length
}
