import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let request = new Utils.SaleUtils

import test, { ExecutionContext } from 'ava'

export function validateSaleList(t: ExecutionContext, sale: Model.SalesModel) {
    t.truthy(sale.id)
    t.truthy(sale.title)
    t.truthy(sale.endTime)

    if (sale.image) {
        t.true(request.validateImage(sale.image))
    }
    if (sale.image1) {
        t.true(request.validateImage(sale.image1))
    }
    if (sale.image2) {
        t.true(request.validateImage(sale.image2))
    }
    if (sale.image3) {
        t.true(request.validateImage(sale.image3))
    }
    if (sale.image4) {
        t.true(request.validateImage(sale.image4))
    }

    if (sale.categories) {
        t.truthy(sale.categories.length)
    }

    if (sale.potd === false) {
        t.true(sale.slug.includes(sale.id))
    } else if (sale.potd === true) {
        t.false(sale.slug.includes(sale.id))
    }

    t.deepEqual(typeof (sale.international), 'boolean')
}

test('GET / all home sales', async t => {
    let res = await request.get(config.api.home)
    let home: Model.Home = res.body

    t.true(home.hasOwnProperty('featured'))
    t.true(home.hasOwnProperty('today'))
    t.true(home.hasOwnProperty('current'))
    t.true(home.hasOwnProperty('potd'))
    t.true(home.hasOwnProperty('banners'))
    t.true(home.hasOwnProperty('upcoming'))

    if (home.banners.length > 0) {
        home.banners.forEach(banner => {
            t.true(request.validateImage(banner.image))
            t.truthy(banner.url)
        })
    }
})

test('GET / ongoing sales - current', async t => {
    let sales = await request.getSales(config.api.currentSales)

    sales.forEach(sale => {
        validateSaleList(t, sale)
    })
})

test('GET / ongoing sales - today', async t => {
    let sales = await request.getSales(config.api.todaySales)

    sales.forEach(sale => {
        validateSaleList(t, sale)
    })
})

test('GET / ongoing sales - featured', async t => {
    let sales = await request.getSales(config.api.featuredSales)

    sales.forEach(sale => {
        validateSaleList(t, sale)
    })
})

test('GET / ongoing sales - international', async t => {
    let sales = await request.getSales(config.api.internationalSales)

    sales.forEach(sale => {
        validateSaleList(t, sale)
    })
})

test('GET / ongoing sales - POTD', async t => {
    let sales = await request.getSales(config.api.potdSales)

    sales.forEach(sale => {
        validateSaleList(t, sale)
    })
})

test('GET / ongoing sales - current apparel', async t => {
    let sales = await request.getSales(config.api.cateApparel + '/sales/current')

    sales.forEach(sale => {
        validateSaleList(t, sale)
    })
})

test('GET / ongoing sales - current accessories', async t => {
    let sales = await request.getSales(config.api.cateAccessories + '/sales/current')

    sales.forEach(sale => {
        validateSaleList(t, sale)
    })
})

test('GET / ongoing sales - current bags shoes', async t => {
    let sales = await request.getSales(config.api.cateBagsShoes + '/sales/current')

    sales.forEach(sale => {
        validateSaleList(t, sale)
    })
})

test('GET / ongoing sales - current health beauty', async t => {
    let sales = await request.getSales(config.api.cateHealthBeauty + '/sales/current')

    sales.forEach(sale => {
        validateSaleList(t, sale)
    })
})

test('GET / ongoing sales - current home lifestyle', async t => {
    let sales = await request.getSales(config.api.cateHomeLifeStyle + '/sales/current')

    sales.forEach(sale => {
        validateSaleList(t, sale)
    })
})

test('GET / international sales', async t => {
    let sales = await request.getSales(config.api.internationalSales)

    sales.forEach(sale => {
        t.true(sale.international)
    })
})

test('GET / POTD sales', async t => {
    let sales = await request.getSales(config.api.potdSales)

    sales.forEach(sale => {
        t.truthy(sale.product.id)
        t.truthy(sale.product.brand)
        t.truthy(sale.product.title)
        t.true(sale.product.retailPrice >= sale.product.salePrice)
        t.truthy(sale.product.images)
        t.true(sale.slug.includes(sale.product.id))
    })
})

test('GET / Upcoming sales', async t => {
    let dates = await request.getUpcomingSales()
    t.true(dates.length > 0)

    for (let date of dates) {
        t.truthy(date.date)
        t.truthy(date.year)
        t.truthy(date.sales)

        for (let sale of date.sales) {
            t.truthy(sale.id)
            t.truthy(sale.title)
            t.true(request.validateImage(sale.image))
            t.true(sale.slug.includes(sale.id))
            t.truthy(sale.categories)
            t.deepEqual(typeof (sale.international), 'boolean')
        }
    }
})