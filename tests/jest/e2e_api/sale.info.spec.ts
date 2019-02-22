import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as model from '../../../common/interface'

let request = new Utils.SaleUtils
let access = new Utils.DbAccessUtils

export const SaleInfoTest = () => {
    beforeAll(async () => {
        jest.setTimeout(120000)
    })

    it('GET / invalid sale ID', async () => {
        let res = await request.get(config.api.sales + 'INVALID-ID')
        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('INVALID_SALE_ID')
    })

    it('GET / no sale matching', async () => {
        let res = await request.get(config.api.sales + 'invalid-5bd6c3137cf0476b22488d21')
        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('NO_SALE_MATCHING')
    })

    it('GET / sale not started', async () => {
        let futureSale = await access.getSale({
            startDate: { $gt: new Date() }
        })
        let res = await request.get(config.api.sales + futureSale._id)
        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('SALE_NOT_FOUND')
    })

    it('GET / sale has ended', async () => {
        let endedSale = await access.getSale({
            endDate: { $lt: new Date() }
        })
        let res = await request.get(config.api.sales + endedSale._id)
        expect(res.statusCode).toEqual(410)
        expect(res.body.message).toEqual('SALE_HAS_ENDED')
    })

    it('GET / invalid upcoming sale ID', async () => {
        let res = await request.get(config.api.upcomingSale + 'INVALID-ID')
        expect(res.statusCode).toEqual(500)
    }) // wait for WWW-338 to fix

    it('GET / no upcoming sale matching', async () => {
        let res = await request.get(config.api.upcomingSale + '566979b534cbcd100061967b')
        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('NO_UPCOMING_SALE_MATCHING')
    })

    it('GET / upcoming sale ended', async () => {
        let endedSale = await access.getSale({
            endDate: { $lt: new Date() }
        })
        let res = await request.get(config.api.upcomingSale + endedSale._id)
        expect(res.statusCode).toEqual(410)
        expect(res.body.message).toEqual('SALE_HAS_ENDED')
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
        ('GET / valid onging sale %s', async (saleType) => {
            let sales = await request.getSales(saleType)
            expect(sales.length).toBeGreaterThanOrEqual(1)

            for (let sale of sales) {
                try {
                    let res = await request.getSaleInfo(sale.id)
                    expect(res.id).toEqual(sale.id)
                    expect(res.title).not.toBeEmpty()
                    expect(res.endTime).toEqual(sale.endTime)
                    expect(new Date(res.startTime)).toBeBefore(new Date())

                    expect(res.products.length).toBeGreaterThan(0)
                    res.products.forEach(product => {
                        try {
                            expect(product.id).not.toBeEmpty()
                            expect(product.title).not.toBeEmpty()
                            expect(request.validateImage(product.image)).toBeTrue()
                            expect(request.validateImage(product.image2)).toBeTrue()
                            expect(product.retailPrice).toBeGreaterThanOrEqual(product.salePrice)
                            // expect(product.retailPrice).not.toEqual(18900000) // 18900000 is fake data that may not be imported accidentally
                            expect(product.soldOut).toBeBoolean()
                            expect(product.category).not.toBeEmpty()
                            expect(product.brand).not.toBeEmpty()
                            expect(product.slug).toInclude(product.id)
                            expect(product.quantity).toBeNumber()
                            expect(product.numberOfVariations).toBeGreaterThanOrEqual(0)
                            expect(product.nsId).not.toBeEmpty()
                            expect(product.isSecretSale).toBeFalse()
                        } catch (error) {
                            // console.log(product)
                            throw { failed_product: product, failed_sale: sale.id, error: error }
                        }
                    })

                    expect(res.filter.gender).toBeArray()
                    expect(res.filter.type).toBeArray()
                    expect(res.filter.color).toBeArray()
                    expect(res.filter.size).toBeArray()
                    expect(res.filter.brand).toBeArray()
                    expect(res.filter.category.length).toBeGreaterThan(0)

                    expect(res.sort).toContainAllValues(['RECOMMENDED',
                        'HIGHEST_DISCOUNT',
                        'LOW_PRICE',
                        'HIGH_PRICE'])

                    expect(res.campaign).toBeFalse()
                    expect(res.slug).toInclude(res.id)
                } catch (error) {
                    throw { failed_sale: sale.id, error: error }
                }
            }
        })

    it('GET / valid ongoing sale ID with filter by category', async () => {
        let sales = await request.getSales(config.api.todaySales)

        for (let sale of sales) {
            let saleInfo = await request.getSaleInfo(sale.id)
            let filteredSale = await request.getSaleInfo(saleInfo.id + '?category=' +
                saleInfo.filter.category[0].value)

            filteredSale.products.forEach(product => {
                try {
                    expect(product.category).toEqual(saleInfo.filter.category[0].display)
                } catch (error) {
                    throw { failed_product: product, error: error }
                }
            })
        }
    })

    it('GET / valid ongoing sale ID with filter by size', async () => {
        let sales = await request.getSales(config.api.currentSales)

        for (let sale of sales) {
            let saleInfo = await request.getSaleInfo(sale.id)

            if (saleInfo.filter.size.length > 1) {
                let filteredSale = await request.getSaleInfo(saleInfo.id + '?size=' +
                    saleInfo.filter.size[0].value)

                filteredSale.products.forEach(product => {
                    try {
                        expect(product.size).toEqual(saleInfo.filter.size[0].display)
                    } catch (error) {
                        throw { failed_product: product, error: error }
                    }
                })
            }
        }
    })

    it('GET / valid ongoing sale ID with filter by brand', async () => {
        let sales = await request.getSales(config.api.currentSales)

        for (let sale of sales) {
            let saleInfo = await request.getSaleInfo(sale.id)

            if (saleInfo.filter.brand.length > 1) {
                let filteredSale = await request.getSaleInfo(saleInfo.id + '?brand=' +
                    saleInfo.filter.brand[0].value)

                filteredSale.products.forEach(product => {
                    try {
                        expect(product.brand).toEqual(saleInfo.filter.brand[0].display)
                    } catch (error) {
                        throw { failed_product: product, error: error }
                    }
                })
            }
        }
    })

    it('GET / valid upcoming sale ID', async () => {
        let dates = await request.getUpcomingSales()
        expect(dates.length).toBeGreaterThan(1)

        for (let date of dates) {
            for (let sale of date.sales) {
                try {
                    expect(date.sales.length).toBeGreaterThanOrEqual(1)

                    let res = await request.get(config.api.upcomingSale + sale.id)
                    let upcoming: model.UpcomingInfo
                    upcoming = res.body

                    expect(res.statusCode).toEqual(200)
                    expect(upcoming.id).toEqual(sale.id)

                    if (upcoming.description) {
                        expect(upcoming.description).not.toBeEmpty()
                    }

                    expect(request.validateImage(upcoming.image)).toBeTrue()
                    expect(upcoming.title).not.toBeEmpty()
                    expect(new Date(upcoming.startTime)).toBeAfter(new Date())
                } catch (error) {
                    throw { failed_sale: sale, error: error }
                }
            }
        }
    })
}

describe('Sale info API ' + config.baseUrl + config.api.sales, SaleInfoTest)