import config from '../../config/config'
import { Utils } from '../../common'
import 'jest-extended'
let request = new Utils()
import * as model from '../../common/interface'

describe('Sale info API ' + config.baseUrl + config.api.sales + '/<saleID>', () => {
    test('GET / invalid sale ID', async () => {
        let response = await request.get(config.api.sales + 'INVALID-ID')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('INVALID_SALE_ID')
    })

    test('GET / no sale matching', async () => {
        let response = await request.get(config.api.sales + 'invalid-5bd6c3137cf0476b22488d21')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('NO_SALE_MATCHING')
    })

    test('GET / sale has ended', async () => {
        let response = await request.get(config.api.sales + '566979b534cbcd100061967a')
        expect(response.status).toEqual(410)
        expect(response.data.message).toEqual('SALE_HAS_ENDED')
    })

    test.skip('GET / invalid upcoming sale ID', async () => {
        let response = await request.get(config.api.upcomingSale + 'INVALID-ID')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('INVALID_SALE_ID')
    }) // wait for WWW-338 to fix

    test('GET / no upcoming sale matching', async () => {
        let response = await request.get(config.api.upcomingSale + '566979b534cbcd100061967b')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('NO_UPCOMING_SALE_MATCHING')
    })

    test('GET / upcoming sale ended', async () => {
        let response = await request.get(config.api.upcomingSale + '566979b534cbcd100061967a')
        expect(response.status).toEqual(410)
        expect(response.data.message).toEqual('SALE_HAS_ENDED')
    })

    test('GET / valid ongoing sale ID', async () => {
        let sales = await request.getSales(config.api.featuredSales)
        expect(sales.length).toBeGreaterThanOrEqual(1)

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
                expect(product.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                expect(product.image2.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
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

            expect(response.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
            expect(response.campaign).toBeBoolean()
            expect(response.slug).toInclude(response.id)
        }
    }, 90000)

    test('GET / valid upcoming sale ID', async () => {
        let dates = await request.getUpcomingSales()
        expect(dates.length).toBeGreaterThan(1)
        for (let date of dates) {
            for (let sale of date.sales) {
                expect(date.sales.length).toBeGreaterThan(1)
                
                let response = await request.get(config.api.upcomingSale + sale.id)
                let upcoming: model.UpcomingInfo
                upcoming = response.data
                expect(response.status).toEqual(200)
                expect(upcoming.id).toEqual(sale.id)
                expect(upcoming.description).not.toBeEmpty()
                expect(upcoming.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                expect(upcoming.title).not.toBeEmpty()
                expect(new Date(upcoming.startTime)).toBeAfter(new Date())
            }
        }
    })
})