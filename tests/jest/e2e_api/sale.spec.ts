import config from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as model from '../../../common/interface'

describe('Sale info API ' + config.baseUrl + config.api.sales + '/<saleID>', () => {
    it('GET / invalid sale ID', async () => {
        let response = await request.get(config.api.sales + 'INVALID-ID')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('INVALID_SALE_ID')
    })

    it('GET / no sale matching', async () => {
        let response = await request.get(config.api.sales + 'invalid-5bd6c3137cf0476b22488d21')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('NO_SALE_MATCHING')
    })

    it('GET / sale not started', async () => {
        let futureSale = await access.getSale({
            startDate: { $gt: new Date() }
        })
        let response = await request.get(config.api.sales + futureSale._id)
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('SALE_NOT_FOUND')
    })

    it('GET / sale has ended', async () => {
        let endedSale = await access.getSale({
            endDate: { $lt: new Date() }
        })
        let response = await request.get(config.api.sales + endedSale._id)
        expect(response.status).toEqual(410)
        expect(response.data.message).toEqual('SALE_HAS_ENDED')
    })

    test.skip('GET / invalid upcoming sale ID', async () => {
        let response = await request.get(config.api.upcomingSale + 'INVALID-ID')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('INVALID_SALE_ID')
    }) // wait for WWW-338 to fix

    it('GET / no upcoming sale matching', async () => {
        let response = await request.get(config.api.upcomingSale + '566979b534cbcd100061967b')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('NO_UPCOMING_SALE_MATCHING')
    })

    it('GET / upcoming sale ended', async () => {
        let endedSale = await access.getSale({
            endDate: { $lt: new Date() }
        })
        let response = await request.get(config.api.upcomingSale + endedSale._id)
        expect(response.status).toEqual(410)
        expect(response.data.message).toEqual('SALE_HAS_ENDED')
    })

    it('GET / valid ongoing sale ID', async () => {
        let sales = await request.getSales(config.api.currentSales)
        expect(sales.length).toBeGreaterThanOrEqual(1)

        for (let sale of sales) {
            try {
                let response = await request.getSaleInfo(sale.id)
                expect(response.id).toEqual(sale.id)
                expect(response.title).not.toBeEmpty()
                expect(response.endTime).toEqual(sale.endTime)
                expect(new Date(response.startTime)).toBeBefore(new Date())

                expect(response.products).toBeArray()
                for (let product of response.products) {
                    try {
                        expect(product.id).not.toBeEmpty()
                        expect(product.title).not.toBeEmpty()
                        expect(product.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                        expect(product.image2.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                        expect(product.retailPrice).toBeGreaterThanOrEqual(product.salePrice)
                        expect(product.soldOut).toBeBoolean()
                        expect(product.category).not.toBeEmpty()
                        expect(product.brand).not.toBeEmpty()
                        expect(product.slug).toInclude(product.id)
                        expect(product.quantity).toBeNumber()
                        expect(product.numberOfVariations).toBeGreaterThanOrEqual(0)
                    } catch (error) {
                        throw { failed_product: product, failed_sale: sale.id, error: error }
                    }
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
                expect(response.campaign).toBeFalse()
                expect(response.slug).toInclude(response.id)
            } catch (error) {
                throw { failed_sale: sale.id, error: error }
            }
        }
    })

    it('GET / valid ongoing sale ID with filter', async () => {
        let sales = await request.getSales(config.api.featuredSales)
        let sale = await request.getSaleInfo(sales[0].id)

        for (let filter of Object.keys(sale.filter)) {
            if (sale.filter[filter].length > 0) {
                let filterValue = sale.filter[filter][0]['value']
                let filteredSale = await request.getSaleInfo(sales[0].id + `?${filter}=${filterValue}`)
                expect(filteredSale.products.length).toBeLessThanOrEqual(sale.products.length)
            }
        }
    })

    it('GET / valid ongoing sale ID with multiple filters', async () => {
        let sales = await request.getSales(config.api.featuredSales)
        let sale = await request.getSaleInfo(sales[0].id)

        let filterList = []
        for (let filter of Object.keys(sale.filter)) {
            if (sale.filter[filter].length > 0) {
                let filterValue = sale.filter[filter][0]['value']
                filterList.push(`${filter}=${filterValue}`)
            }
        }

        let filterString = '?' + filterList[0]
        filterList.shift()
        filterString = filterString + '&' + filterList.join('&')

        let filteredSale = await request.getSaleInfo(sales[0].id + filterString)
        expect(filteredSale.products.length).toBeLessThan(sale.products.length)
    })

    it('GET / valid upcoming sale ID', async () => {
        let dates = await request.getUpcomingSales()
        expect(dates.length).toBeGreaterThan(1)

        for (let date of dates) {
            for (let sale of date.sales) {
                try {
                    expect(date.sales.length).toBeGreaterThanOrEqual(1)

                    let response = await request.get(config.api.upcomingSale + sale.id)
                    let upcoming: model.UpcomingInfo
                    upcoming = response.data

                    expect(response.status).toEqual(200)
                    expect(upcoming.id).toEqual(sale.id)

                    if (upcoming.description) {
                        expect(upcoming.description).not.toBeEmpty()
                    }

                    expect(upcoming.image.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
                    expect(upcoming.title).not.toBeEmpty()
                    expect(new Date(upcoming.startTime)).toBeAfter(new Date())
                } catch (error) {
                    throw { failed_sale: sale, error: error }
                }
            }
        }
    })
})