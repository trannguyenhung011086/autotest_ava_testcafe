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

    it.each([[config.api.currentSales],
    [config.api.todaySales],
    [config.api.featuredSales],
    [config.api.internationalSales],
    [config.api.potdSales],
    [config.api.cateAccessories + '/sales/current'],
    [config.api.cateApparel + '/sales/current'],
    [config.api.cateBagsShoes + '/sales/current'],
    [config.api.cateHealthBeauty + '/sales/current'],
    [config.api.cateHomeLifeStyle + '/sales/current']])
        ('GET / onging sales %s', async (saleType) => {
            let sales = await request.getSales(saleType)
            expect(sales.length).toBeGreaterThanOrEqual(1)

            sales.forEach(sale => {
                try {
                    expect(sale.id).not.toBeEmpty()
                    expect(sale.title).not.toBeEmpty()
                    expect(sale.endTime).not.toBeEmpty()

                    if (sale.image) {
                        expect(sale.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                    }
                    if (sale.image1) {
                        expect(sale.image1.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                    }
                    if (sale.image2) {
                        expect(sale.image2.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                    }
                    if (sale.image3) {
                        expect(sale.image3.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                    }
                    if (sale.image4) {
                        expect(sale.image4.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                    }

                    if (sale.categories) {
                        expect(sale.categories.length).toBeGreaterThanOrEqual(1)
                    }

                    if (sale.potd === false) {
                        expect(sale.slug).toInclude(sale.id)
                    } else {
                        expect(sale.slug).not.toInclude(sale.id)
                    }

                    expect(sale.international).toBeBoolean()
                } catch (error) {
                    throw { failed_sale: sale, error: error }
                }
            })
        })



    it('GET / international sales', async () => {
        let sales = await request.getSales(config.api.internationalSales)
        expect(sales.length).toBeGreaterThanOrEqual(1)

        sales.forEach(sale => {
            try {
                expect(sale.international).toBeTrue()
            } catch (error) {
                throw { failed_sale: sale, error: error }
            }
        })
    })

    it('GET / POTD sales', async () => {
        let sales = await request.getSales(config.api.potdSales)
        expect(sales.length).toBeGreaterThanOrEqual(1)

        sales.forEach(sale => {
            try {
                expect(sale.product.id).not.toBeEmpty()
                expect(sale.product.brand).not.toBeEmpty()
                expect(sale.product.title).not.toBeEmpty()
                expect(sale.product.retailPrice).toBeGreaterThanOrEqual(sale.product.salePrice)
                expect(sale.product.images).toBeArray()
                expect(sale.slug).toInclude(sale.product.id)
            } catch (error) {
                throw { failed_sale: sale, error: error }
            }
        })
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
