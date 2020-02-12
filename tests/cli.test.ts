
import {Datapack} from '../src/codegen/Datapack'

describe('compilation test', () => {

	it('compilation', async () => {
		let dp = await Datapack.load('./dp')
		await dp.compile({})
	})

})
