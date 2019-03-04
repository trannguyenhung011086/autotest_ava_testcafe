import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let request = new Utils.SaleUtils
let access = new Utils.DbAccessUtils

import test from 'ava'

test('GET / invalid sale ID', async t => {
    const res = await request.get(config.api.sales + 'INVALID-ID')

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'INVALID_SALE_ID')
})

test('GET / no sale matching', async t => {
    const res = await request.get(config.api.sales + 'invalid-5bd6c3137cf0476b22488d21')

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'NO_SALE_MATCHING')
})

test('GET / sale not started', async t => {
    let futureSale = await access.getSale({
        startDate: { $gt: new Date() }
    })
    const res = await request.get(config.api.sales + futureSale._id)

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'SALE_NOT_FOUND')
})

test('GET / sale has ended', async t => {
    let endedSale = await access.getSale({
        endDate: { $lt: new Date() }
    })
    const res = await request.get(config.api.sales + endedSale._id)

    t.deepEqual(res.statusCode, 410)
    t.deepEqual(res.body.message, 'SALE_HAS_ENDED')
})

test('GET / invalid upcoming sale ID', async t => {
    const res = await request.get(config.api.upcomingSale + 'INVALID-ID')

    t.deepEqual(res.statusCode, 500)
})

test('GET / no upcoming sale matching', async t => {
    const res = await request.get(config.api.upcomingSale + '566979b534cbcd100061967b')

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'NO_UPCOMING_SALE_MATCHING')
})

test('GET / upcoming sale ended', async t => {
    let endedSale = await access.getSale({
        endDate: { $lt: new Date() }
    })
    const res = await request.get(config.api.upcomingSale + endedSale._id)

    t.deepEqual(res.statusCode, 410)
    t.deepEqual(res.body.message, 'SALE_HAS_ENDED')
})

test('GET / valid ongoing sale - current', async t => {
    let sales = await request.getSales(config.api.currentSales)

    for (let sale of sales) {
        const res = await request.getSaleInfo(sale.id)
        request.validateSaleInfo(t, res)

        t.deepEqual(res.id, sale.id)
        t.deepEqual(res.endTime, sale.endTime)
    }
})

test('GET / valid ongoing sale - today', async t => {
    let sales = await request.getSales(config.api.todaySales)

    for (let sale of sales) {
        const res = await request.getSaleInfo(sale.id)
        request.validateSaleInfo(t, res)

        t.deepEqual(res.id, sale.id)
        t.deepEqual(res.endTime, sale.endTime)
    }
})

test('GET / valid ongoing sale - featured', async t => {
    let sales = await request.getSales(config.api.featuredSales)

    for (let sale of sales) {
        const res = await request.getSaleInfo(sale.id)
        request.validateSaleInfo(t, res)

        t.deepEqual(res.id, sale.id)
        t.deepEqual(res.endTime, sale.endTime)
    }
})

test('GET / valid ongoing sale - international', async t => {
    let sales = await request.getSales(config.api.internationalSales)

    for (let sale of sales) {
        const res = await request.getSaleInfo(sale.id)
        request.validateSaleInfo(t, res)

        t.deepEqual(res.id, sale.id)
        t.deepEqual(res.endTime, sale.endTime)
    }
})

test('GET / valid ongoing sale - POTD', async t => {
    let sales = await request.getSales(config.api.potdSales)

    for (let sale of sales) {
        const res = await request.getSaleInfo(sale.id)
        request.validateSaleInfo(t, res)

        t.deepEqual(res.id, sale.id)
        t.deepEqual(res.endTime, sale.endTime)
    }
})

test('GET / valid ongoing sale - current apparel', async t => {
    let sales = await request.getSales(config.api.cateApparel + '/sales/current')

    for (let sale of sales) {
        const res = await request.getSaleInfo(sale.id)
        request.validateSaleInfo(t, res)

        t.deepEqual(res.id, sale.id)
        t.deepEqual(res.endTime, sale.endTime)
    }
})

test('GET / valid ongoing sale - current accessories', async t => {
    let sales = await request.getSales(config.api.cateAccessories + '/sales/current')

    for (let sale of sales) {
        const res = await request.getSaleInfo(sale.id)
        request.validateSaleInfo(t, res)

        t.deepEqual(res.id, sale.id)
        t.deepEqual(res.endTime, sale.endTime)
    }
})

test('GET / valid ongoing sale - current bags shoes', async t => {
    let sales = await request.getSales(config.api.cateBagsShoes + '/sales/current')

    for (let sale of sales) {
        const res = await request.getSaleInfo(sale.id)
        request.validateSaleInfo(t, res)

        t.deepEqual(res.id, sale.id)
        t.deepEqual(res.endTime, sale.endTime)
    }
})

test('GET / valid ongoing sale - current health beauty', async t => {
    let sales = await request.getSales(config.api.cateHealthBeauty + '/sales/current')

    for (let sale of sales) {
        const res = await request.getSaleInfo(sale.id)
        request.validateSaleInfo(t, res)

        t.deepEqual(res.id, sale.id)
        t.deepEqual(res.endTime, sale.endTime)
    }
})

test('GET / valid ongoing sale - current home lifestyle', async t => {
    let sales = await request.getSales(config.api.cateHomeLifeStyle + '/sales/current')

    for (let sale of sales) {
        const res = await request.getSaleInfo(sale.id)
        request.validateSaleInfo(t, res)

        t.deepEqual(res.id, sale.id)
        t.deepEqual(res.endTime, sale.endTime)
    }
})

test('GET / valid ongoing sale ID with filter by category', async t => {
    let sales = await request.getSales(config.api.todaySales)

    for (let sale of sales) {
        let saleInfo = await request.getSaleInfo(sale.id)
        let filteredSale = await request.getSaleInfo(saleInfo.id + '?category=' +
            saleInfo.filter.category[0].value)

        filteredSale.products.forEach(product => {
            t.deepEqual(product.category, saleInfo.filter.category[0].display)
        })
    }
})

test('GET / valid ongoing sale ID with filter by size', async t => {
    let sales = await request.getSales(config.api.currentSales)

    for (let sale of sales) {
        let saleInfo = await request.getSaleInfo(sale.id)

        if (saleInfo.filter.size.length > 1) {
            let filteredSale = await request.getSaleInfo(saleInfo.id + '?size=' +
                saleInfo.filter.size[0].value)

            filteredSale.products.forEach(product => {
                t.deepEqual(product.size, saleInfo.filter.size[0].display)
            })
        }
    }
})

test('GET / valid ongoing sale ID with filter by brand', async t => {
    let sales = await request.getSales(config.api.currentSales)

    for (let sale of sales) {
        let saleInfo = await request.getSaleInfo(sale.id)

        if (saleInfo.filter.brand.length > 1) {
            let filteredSale = await request.getSaleInfo(saleInfo.id + '?brand=' +
                saleInfo.filter.brand[0].value)

            filteredSale.products.forEach(product => {
                t.deepEqual(product.brand, saleInfo.filter.brand[0].display)
            })
        }
    }
})

test('GET / valid upcoming sale ID', async t => {
    let dates = await request.getUpcomingSales()
    t.true(dates.length > 0)

    for (let date of dates) {
        for (let sale of date.sales) {
            t.true(date.sales.length > 0)

            const res = await request.get(config.api.upcomingSale + sale.id)
            let upcoming: Model.UpcomingInfo
            upcoming = res.body

            t.deepEqual(res.statusCode, 200)
            t.deepEqual(upcoming.id, sale.id)

            if (upcoming.description) {
                t.truthy(upcoming.description)
            }

            t.true(request.validateImage(upcoming.image))
            t.truthy(upcoming.title)
            t.true(new Date(upcoming.startTime).getTime() > new Date().getTime())
        }
    }
})