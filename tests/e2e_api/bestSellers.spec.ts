import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'

describe('Best sellers info API ' + config.baseUrl + config.api.bestSellers, () => {
    test('GET / best sellers list', async () => {
        let response = await request.getBestSellers()
        // expect(response.length).toEqual(16) // wait for WWW-238

        for (let item of response) {
            try {
                expect(item.id).not.toBeEmpty()
                expect(item.title).not.toBeEmpty()
                expect(item.brand).not.toBeEmpty()
                expect(item.retailPrice).toBeGreaterThan(item.salePrice)
                expect(item.category).not.toBeEmpty()
                expect(item.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                expect(item.image2.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                expect(item.cr).toBeNumber()
                expect(item.slug).toInclude(item.id)
                expect(item.international).toBeBoolean()
                expect(parseFloat(item.score)).toBeGreaterThanOrEqual(0)
            } catch (error) {
                throw { failed_item: item, error: error }
            }
        }
    })
})