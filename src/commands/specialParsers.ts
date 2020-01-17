import { TokenI } from "../lexing/Token"

const numRgx = /^(?<b10>-?\d+(?:\.\d+)?)/g
export function readNumber(
	token:TokenI,
	integer:boolean,
	negative:boolean,
	zero:boolean,
	i:number
): number | string {
	numRgx.lastIndex = 0
	let res = numRgx.exec(token.value.slice(i))
	if (!res||!res.groups)
		return 'expected number'
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
		return res[0].length + 1
	} else throw new Error('not implemented other than base 10 nums')
}

const selRgx = /^@(?<typ>[apser])(?:(?!\[)|(?:\[[^\]\s]*?\]))/g // improve and fix this
export function readSelector(
	token:TokenI,
	i:number,
	multiple:boolean,
	playerOnly:boolean
): number | string {
	selRgx.lastIndex = 0
	let res = selRgx.exec(token.value.slice(i))
	if (!res||!res.groups)
		return 'expected selector'
	if (!multiple && 'ae'.includes(res.groups['typ']))
		return 'only singular selector'
	if (playerOnly && 'es'.includes(res.groups['typ']))
		return 'only players'
	return res[0].length + 1
}
