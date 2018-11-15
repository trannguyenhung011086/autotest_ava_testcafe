import config from '../../config/config'
import { Utils } from '../../common'
import 'jest-extended'
let request = new Utils()

describe('Sale info API ' + config.baseUrl + config.api.sales + '/<saleID>', () => {
    test('GET / sale info - wrong sale ID', async () => {
        let response = await request.get(config.api.sales + 'invalid-5bd6c3137cf0476b22488d2')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('INVALID_SALE_ID')
    })

    test('GET / sale info - no sale matching', async () => {
        let response = await request.get(config.api.sales + 'invalid-5bd6c3137cf0476b22488d21')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('NO_SALE_MATCHING')
    })

    test('GET / sale info - valid sale ID', async () => {
        let sales = await request.getSales(config.api.todaySales)

        for (let sale of sales) {
            let response = await request.getSaleInfo(sale.id)

            expect(response.id).toEqual(sale.id)
            expect(response.title).not.toBeEmpty()
            expect(response.endTime).toEqual(sale.endTime)
            expect(new Date(response.startTime).getTime()).toBeLessThanOrEqual(new Date().getTime())

            expect(response.products).toBeArray()
            for (let product of response.products) {
                expect(product.id).not.toBeEmpty()
                expect(product.title).not.toBeEmpty()
                expect(product.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg/)
                expect(product.image2.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg/)
                expect(product.retailPrice).toBeGreaterThan(product.salePrice)
                expect(product.soldOut).toBeBoolean()
                expect(product.category).not.toBeEmpty()
                expect(product.brand).not.toBeEmpty()
                expect(product.slug).toInclude(product.id)
                expect(product.quantity).toBeNumber()
                expect(product.numberOfVariations).toBeGreaterThanOrEqual(0)
            }

            expect(response.filter.gender).toBeArray()
            expect(response.filter.type).toBeArray()
            expect(response.filter.color).toBeArray()
            expect(response.filter.size).toBeArray()
            expect(response.filter.brand).toBeArray()
            expect(response.filter.category).toBeArray()

            expect(response.sort).toContainAllValues(['RECOMMENDED',
                'HIGHEST_DISCOUNT',
                'LOW_PRICE',
                'HIGH_PRICE'])

            expect(response.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg/)
            expect(response.campaign).toBeBoolean()
            expect(response.slug).toInclude(response.id)
        }
    })
})