import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as model from '../../../common/interface'
let home: model.Home

export const SaleListTest = () => {
    it('GET / all home sales', async () => {
        let res = await request.get(config.api.home)
        home = res.body
        expect(res.statusCode).toEqual(200)

        expect(home).toContainAllKeys(['featured',
            'today',
            'current',
            'potd',
            'banners',
            'upcoming'])
        expect(home.featured).toBeObject()
        expect(home.today).toBeArray()
        expect(home.current).toBeArray()
        expect(home.potd).toBeArray()
        expect(home.banners).toBeArray()
        expect(home.upcoming).toBeArray()

        if (home.banners.length > 0) {
            for (let banner of home.banners) {
                expect(banner.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                expect(banner.url).toBeString()
            }
        }
    })

    it('GET / today sales', async () => {
        let sales = await request.getSales(config.api.todaySales)
        expect(sales.length).toBeGreaterThanOrEqual(1)

        for (let sale of sales) {
            try {
                expect(sale.id).not.toBeEmpty()
                expect(sale.title).not.toBeEmpty()
                expect(sale.endTime).not.toBeEmpty()
                expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                expect(sale.slug).toInclude(sale.id)
                expect(sale.categories.length).toBeGreaterThanOrEqual(1)
                expect(sale.potd).toBeBoolean()
                expect(sale.international).toBeBoolean()
            } catch (error) {
                throw { failed_sale: sale, error: error }
            }
        }
    })

    it('GET / current sales', async () => {
        let sales = await request.getSales(config.api.currentSales)
        expect(sales.length).toBeGreaterThanOrEqual(1)

        for (let sale of sales) {
            try {
                expect(sale.id).not.toBeEmpty()
                expect(sale.title).not.toBeEmpty()
                expect(sale.endTime).not.toBeEmpty()
                expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                expect(sale.slug).toInclude(sale.id)
                expect(sale.categories.length).toBeGreaterThanOrEqual(1)
                expect(sale.potd).toBeBoolean()
                expect(sale.international).toBeBoolean()
            } catch (error) {
                throw { failed_sale: sale, error: error }
            }
        }
    })

    it('GET / featured sales', async () => {
        let sales = await request.getSales(config.api.featuredSales)
        expect(sales.length).toBeGreaterThanOrEqual(1)

        for (let sale of sales) {
            try {
                expect(sale.id).not.toBeEmpty()
                expect(sale.title).not.toBeEmpty()
                expect(sale.endTime).not.toBeEmpty()
                expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                expect(sale.slug).toInclude(sale.id)
                expect(sale.categories.length).toBeGreaterThanOrEqual(1)
                expect(sale.potd).toBeBoolean()
                expect(sale.international).toBeBoolean()
            } catch (error) {
                throw { failed_sale: sale, error: error }
            }
        }
    })

    it('GET / international sales', async () => {
        let sales = await request.getSales(config.api.internationalSales)
        expect(sales.length).toBeGreaterThanOrEqual(1)

        for (let sale of sales) {
            try {
                expect(sale.id).not.toBeEmpty()
                expect(sale.title).not.toBeEmpty()
                expect(sale.endTime).not.toBeEmpty()
                expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)

                if (sale.potd == false) {
                    expect(sale.slug).toInclude(sale.id)
                } else {
                    expect(sale.slug).not.toInclude(sale.id)
                }

                expect(sale.categories.length).toBeGreaterThanOrEqual(1)
                expect(sale.international).toBeTrue()
            } catch (error) {
                throw { failed_sale: sale, error: error }
            }
        }
    })

    it('GET / POTD sales', async () => {
        let sales = await request.getSales(config.api.potdSales)
        expect(sales.length).toBeGreaterThanOrEqual(1)

        for (let sale of sales) {
            try {
                expect(sale.id).not.toBeEmpty()
                expect(sale.title).not.toBeEmpty()
                expect(sale.endTime).not.toBeEmpty()
                expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                expect(sale.categories.length).toBeGreaterThanOrEqual(1)
                expect(sale.potd).toBeTrue()
                expect(sale.international).toBeBoolean()

                expect(sale.product.id).not.toBeEmpty()
                expect(sale.product.brand).not.toBeEmpty()
                expect(sale.product.title).not.toBeEmpty()
                // expect(sale.product.retailPrice).toBeGreaterThan(sale.product.salePrice)
                expect(sale.product.images).toBeArray()
                expect(sale.slug).toInclude(sale.product.id)
            } catch (error) {
                throw { failed_sale: sale, error: error }
            }
        }
    })

    it('GET / Upcoming sales', async () => {
        let dates = await request.getUpcomingSales()
        expect(dates.length).toBeGreaterThanOrEqual(1)

        for (let date of dates) {
            expect(date.date).not.toBeEmpty()
            expect(date.year).not.toBeEmpty()
            expect(date.sales).toBeArray()
            for (let sale of date.sales) {
                expect(date.sales.length).toBeGreaterThanOrEqual(1)
                try {
                    expect(sale.id).not.toBeEmpty()
                    expect(sale.title).not.toBeEmpty()
                    expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                    expect(sale.slug).toInclude(sale.id)
                    expect(sale.categories.length).toBeGreaterThanOrEqual(1)
                    expect(sale.international).toBeBoolean()
                } catch (error) {
                    throw { failed_sale: sale, error: error }
                }
            }
        }
    })
}

describe('Sale list API ' + config.baseUrl + '/api/v2/home/<saleType>', SaleListTest)
