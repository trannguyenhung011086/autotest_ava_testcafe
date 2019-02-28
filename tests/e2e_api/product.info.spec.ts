import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let product: Model.ProductInfoModel

let request = new Utils.ProductUtils
let accessRedis = new Utils.RedisAccessUtils

import test, { ExecutionContext } from 'ava'

export function validateProductItem(t: ExecutionContext, product: Model.Product) {
    t.truthy(product.id)
    t.truthy(product.nsId)
    t.truthy(product.saleId)
    t.true(product.retailPrice >= product.salePrice)
    t.deepEqual(typeof (product.inStock), 'boolean')
    t.true.skip(product.quantity >= 0)
    t.deepEqual(typeof (product.isVirtual), 'boolean')
    t.deepEqual(typeof (product.isBulky), 'boolean')
}

export function validateProductInfo(t: ExecutionContext, info: Model.ProductInfoModel) {
    t.truthy(info.id)

    t.truthy(info.sale.slug)
    t.true(new Date(info.sale.startTime).getTime() < new Date(info.sale.endTime).getTime())
    t.truthy(info.sale.categories.length)
    t.deepEqual(typeof (info.sale.potd), 'boolean')

    t.true(request.validateImage(info.brand.logo))
    t.truthy(info.brand.name)
    t.truthy(info.brand.description)

    t.truthy(info.title)
    t.deepEqual(typeof (info.returnDays), 'number')

    if (info.returnable) {
        t.deepEqual(typeof (info.returnable), 'boolean')
    }

    t.truthy(info.description.heading)

    info.description.secondary.forEach(item => {
        t.true(item.hasOwnProperty('header'))
        t.truthy(item.data)
    })

    for (const [key, value] of Object.entries(info.images)) {
        value.forEach(value => {
            request.validateImage(value)
        })
    }

    for (let product of info.products) {
        t.true(Object.keys(info.images).includes(product.imageKey))
        validateProductItem(t, product)
    }

    t.truthy(info.sizes)
    t.truthy(info.colors)
}

test('GET / invalid product ID', async t => {
    let res = await request.get(config.api.product + 'INVALID-ID')

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'PRODUCT_NOT_FOUND')
})

test('GET / product of sale not started', async t => {
    if (process.env.NODE_ENV == 'prod') {
        t.pass()
    } else {
        let products = await request.getProducts(config.api.todaySales)

        let redisItem: string
        let originalStart: string

        try {
            redisItem = await accessRedis.getKey('productId:' + products[0].id)
            originalStart = redisItem['event']['startDate']

            // set date on Redis
            redisItem['event']['startDate'] = '2019-02-22T01:00:00.000Z'
            await accessRedis.setValue('productId:' + products[0].id, JSON.stringify(redisItem))

            let res = await request.get(config.api.product + products[0].id)

            t.deepEqual(res.statusCode, 404)
            t.deepEqual(res.body.message, 'SALE_NOT_FOUND')
        } catch (err) {
            throw err
        } finally {
            // reset date on Redis
            redisItem['event']['startDate'] = originalStart
            await accessRedis.setValue('productId:' + products[0].id, JSON.stringify(redisItem))
        }
    }
})

test('GET / product of sale ended', async t => {
    if (process.env.NODE_ENV == 'prod') {
        t.pass()
    } else {
        let products = await request.getProducts(config.api.todaySales)

        let redisItem: string
        let originalEnd: string

        try {
            redisItem = await accessRedis.getKey('productId:' + products[0].id)
            originalEnd = redisItem['event']['endDate']

            // set date on Redis
            redisItem['event']['endDate'] = '2019-02-18T01:00:00.000Z'
            await accessRedis.setValue('productId:' + products[0].id, JSON.stringify(redisItem))

            let res = await request.get(config.api.product + products[0].id)

            t.deepEqual(res.statusCode, 404)
            t.deepEqual(res.body.message, 'SALE_HAS_ENDED')
        } catch (err) {
            throw err
        } finally {
            // reset date on Redis
            redisItem['event']['endDate'] = originalEnd
            await accessRedis.setValue('productId:' + products[0].id, JSON.stringify(redisItem))
        }
    }
})

test('GET / valid product from sale - current', async t => {
    let products = await request.getProducts(config.api.currentSales)
    t.true(products.length > 0)

    for (let i = 0; i < 15; i++) {
        const random = Math.floor(Math.random() * products.length)
        let res = await request.getProductInfo(products[random].id)

        await validateProductInfo(t, res)
    }
})

test('GET / valid product from sale - today', async t => {
    let products = await request.getProducts(config.api.todaySales)
    t.true(products.length > 0)

    for (let i = 0; i < 15; i++) {
        const random = Math.floor(Math.random() * products.length)
        let res = await request.getProductInfo(products[random].id)

        await validateProductInfo(t, res)
    }
})

test('GET / valid product from sale - featured', async t => {
    let products = await request.getProducts(config.api.featuredSales)
    t.true(products.length > 0)

    for (let i = 0; i < 15; i++) {
        const random = Math.floor(Math.random() * products.length)
        let res = await request.getProductInfo(products[random].id)

        await validateProductInfo(t, res)
    }
})

test('GET / valid product from sale - international', async t => {
    let products = await request.getProducts(config.api.internationalSales)
    t.true(products.length > 0)

    for (let i = 0; i < 15; i++) {
        const random = Math.floor(Math.random() * products.length)
        let res = await request.getProductInfo(products[random].id)

        await validateProductInfo(t, res)
    }
})

test('GET / valid product from sale - current apparel', async t => {
    let products = await request.getProducts(config.api.cateApparel + '/sales/current')
    t.true(products.length > 0)

    for (let i = 0; i < 15; i++) {
        const random = Math.floor(Math.random() * products.length)
        let res = await request.getProductInfo(products[random].id)

        await validateProductInfo(t, res)
    }
})

test('GET / valid product from sale - current accessories', async t => {
    let products = await request.getProducts(config.api.cateAccessories + '/sales/current')
    t.true(products.length > 0)

    for (let i = 0; i < 15; i++) {
        const random = Math.floor(Math.random() * products.length)
        let res = await request.getProductInfo(products[random].id)

        await validateProductInfo(t, res)
    }
})

test('GET / valid product from sale - current bags shoes', async t => {
    let products = await request.getProducts(config.api.cateBagsShoes + '/sales/current')
    t.true(products.length > 0)

    for (let i = 0; i < 15; i++) {
        const random = Math.floor(Math.random() * products.length)
        let res = await request.getProductInfo(products[random].id)

        await validateProductInfo(t, res)
    }
})

test('GET / valid product from sale - current health beauty', async t => {
    let products = await request.getProducts(config.api.cateHealthBeauty + '/sales/current')
    t.true(products.length > 0)

    for (let i = 0; i < 15; i++) {
        const random = Math.floor(Math.random() * products.length)
        let res = await request.getProductInfo(products[random].id)

        await validateProductInfo(t, res)
    }
})

test('GET / valid product from sale - current home lifestyle', async t => {
    let products = await request.getProducts(config.api.cateHomeLifeStyle + '/sales/current')
    t.true(products.length > 0)

    for (let i = 0; i < 15; i++) {
        const random = Math.floor(Math.random() * products.length)
        let res = await request.getProductInfo(products[random].id)

        await validateProductInfo(t, res)
    }
})

test('GET / valid product from POTD', async t => {
    let products = await request.getProducts(config.api.potdSales)
    t.true(products.length > 0)

    for (let product of products) {
        let res = await request.getProductInfo(product.id)

        await validateProductInfo(t, res)
        t.true(res.sale.potd)
    }
})

test('GET / sold out product', async t => {
    let product = await request.getSoldOutProductInfo(config.api.currentSales)

    await validateProductInfo(t, product)

    for (let item of product.products) {
        t.false(item.inStock)
        t.true(item.quantity >= 0)
    }
    if (product.sizes.length > 0) {
        for (let size of product.sizes) {
            t.true(size.soldOut)
        }
    }
    if (product.colors.length > 0) {
        for (let color of product.colors) {
            t.true(color.soldOut)
        }
    }
})

test('GET / product with sizes', async t => {
    product = await request.getProductInfoWithSizes(config.api.cateApparel + '/sales/current')

    await validateProductInfo(t, product)

    for (let size of product.sizes) {
        t.truthy(size.availableColors)
        t.truthy(size.name)
        t.deepEqual(typeof (size.quantity), 'number')
        t.deepEqual(typeof (size.soldOut), 'boolean')
    }
})

test('GET / product with colors', async t => {
    product = await request.getProductInfoWithColors(config.api.cateApparel + '/sales/current')

    await validateProductInfo(t, product)

    for (let color of product.colors) {
        t.truthy(color.availableSizes)
        t.truthy(color.hex)
        t.truthy(color.name)
        t.deepEqual(typeof (color.soldOut), 'boolean')

        let res = await request.get(config.api.product + 'view-product/' +
            product.id + '/' + encodeURIComponent(color.name))

        t.deepEqual(res.statusCode, 200)
    }
})

test('GET / product with no color and size', async t => {
    product = await request.getProductInfoNoColorSize(config.api.currentSales)

    await validateProductInfo(t, product)

    t.true(request.validateImage(product.images['All'][0]))
    t.deepEqual(product.products[0].imageKey, 'All')
})