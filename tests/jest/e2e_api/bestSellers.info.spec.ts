import { config } from '../../../config'
import * as Utils from '../../../common/utils'

let request = new Utils.BestSellersUtils

export const BestSellersTest = () => {
    it('GET / best sellers list', async () => {
        let items = await request.getBestSellers()
        // expect(items.length).toEqual(16) // wait for WWW-238

        items.forEach(item => {
            try {
                expect(item.id).not.toBeEmpty()
                expect(item.title).not.toBeEmpty()
                expect(item.brand).not.toBeEmpty()
                expect(item.retailPrice).toBeGreaterThan(item.salePrice)
                expect(item.category).not.toBeEmpty()
                expect(request.validateImage(item.image)).toBeTrue()
                expect(request.validateImage(item.image2)).toBeTrue()
                expect(item.cr).toBeNumber()
                expect(item.slug).toInclude(item.id)
                expect(item.international).toBeBoolean()
                expect(item.nsId).not.toBeEmpty()
                expect(item.quantity).toBeGreaterThanOrEqual(0)
                expect(item.variation).not.toBeEmpty()
                expect(item.variationId).not.toBeEmpty()
                expect(parseInt(item.views)).toBeGreaterThanOrEqual(0)
            } catch (error) {
                throw { failed_item: item, error: error }
            }
        })
    })
}

describe('Best sellers info API ' + config.baseUrl + config.api.bestSellers, BestSellersTest)