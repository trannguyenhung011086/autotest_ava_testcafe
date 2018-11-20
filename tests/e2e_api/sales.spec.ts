import config from '../../config/config'
import { Utils } from '../../common'
import 'jest-extended'
let request = new Utils()

describe('Sale info API ' + config.baseUrl + '/api/v2/home/<saleType>', () => {
    test('GET / all home sales list', async () => {
        let response = await request.get(config.api.home)
        expect(response.status).toEqual(200)
        expect(response.data).toContainAllKeys(['featured',
            'today',
            'current',
            'potd',
            'banners',
            'upcoming'])
        expect(response.data.featured).toBeObject()
        expect(response.data.today).toBeArray()
        expect(response.data.current).toBeArray()
        expect(response.data.potd).toBeArray()
        expect(response.data.banners).toBeArray()
        expect(response.data.upcoming).toBeArray()
    })

    test('GET / today sales list', async () => {
        let sales = await request.getSales(config.api.todaySales)
        for (let sale of sales) {
            expect(sale.id).not.toBeEmpty()
            expect(sale.title).not.toBeEmpty()
            expect(sale.endTime).not.toBeEmpty()
            expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg/)
            expect(sale.slug).toInclude(sale.id)
            expect(sale.categories.length).toBeGreaterThanOrEqual(1)
            expect(sale.potd).toBeBoolean()
            expect(sale.international).toBeBoolean()
        }
    })

    test('GET / current sales list', async () => {
        let sales = await request.getSales(config.api.currentSales)
        for (let sale of sales) {
            expect(sale.id).not.toBeEmpty()
            expect(sale.title).not.toBeEmpty()
            expect(sale.endTime).not.toBeEmpty()
            expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg/)
            expect(sale.slug).toInclude(sale.id)
            expect(sale.categories.length).toBeGreaterThanOrEqual(1)
            expect(sale.potd).toBeBoolean()
            expect(sale.international).toBeBoolean()
        }
    })

    test('GET / featured sales list', async () => {
        let sales = await request.getSales(config.api.featuredSales)
        for (let sale of sales) {
            expect(sale.id).not.toBeEmpty()
            expect(sale.title).not.toBeEmpty()
            expect(sale.endTime).not.toBeEmpty()
            expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg/)
            expect(sale.slug).toInclude(sale.id)
            expect(sale.categories.length).toBeGreaterThanOrEqual(1)
            expect(sale.potd).toBeBoolean()
            expect(sale.international).toBeBoolean()
        }
    })

    test('GET / international sales list', async () => {
        let sales = await request.getSales(config.api.internationalSales)
        for (let sale of sales) {
            expect(sale.id).not.toBeEmpty()
            expect(sale.title).not.toBeEmpty()
            expect(sale.endTime).not.toBeEmpty()
            expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg/)
            expect(sale.slug).toInclude(sale.id)
            expect(sale.categories.length).toBeGreaterThanOrEqual(1)
            expect(sale.potd).toBeBoolean()
            expect(sale.international).toBeTrue()
        }
    })

    test('GET / POTD sales list', async () => {
        let sales = await request.getSales(config.api.potdSales)
        for (let sale of sales) {
            expect(sale.id).not.toBeEmpty()
            expect(sale.title).not.toBeEmpty()
            expect(sale.endTime).not.toBeEmpty()
            expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg/)
            expect(sale.categories.length).toBeGreaterThanOrEqual(1)
            expect(sale.potd).toBeTrue()
            expect(sale.international).toBeBoolean()

            expect(sale.product.id).not.toBeEmpty()
            expect(sale.product.brand).not.toBeEmpty()
            expect(sale.product.title).not.toBeEmpty()
            expect(sale.product.retailPrice).toBeGreaterThan(sale.product.salePrice)
            expect(sale.product.images).toBeArray()
            expect(sale.slug).toInclude(sale.product.id)
        }
    })

    test('GET / Upcoming sales list', async () => {
        let dates = await request.getUpcomingSales()
        for (let date of dates) {
            expect(date.date).not.toBeEmpty()
            expect(date.year).not.toBeEmpty()
            expect(date.sales).toBeArray()
            for (let sale of date.sales) {
                expect(sale.id).not.toBeEmpty()
                expect(sale.title).not.toBeEmpty()
                expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg/)
                expect(sale.slug).toInclude(sale.id)
                expect(sale.categories.length).toBeGreaterThanOrEqual(1)
                expect(sale.international).toBeBoolean()
            }
        }
    })
})
