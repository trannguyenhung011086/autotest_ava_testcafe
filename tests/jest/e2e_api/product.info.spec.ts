import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as model from '../../../common/interface'

let product: model.ProductInfoModel

let request = new Utils.ProductUtils
let accessRedis = new Utils.RedisAccessUtils

export async function validateProductInfo(product: model.Products) {
    try {
        let res = await request.getProductInfo(product.id)
        expect(res.id).toEqual(product.id)

        expect(res.sale.slug).not.toBeEmpty()
        expect(new Date(res.sale.startTime)).toBeBefore(new Date(res.sale.endTime))
        expect(res.sale.categories.length).toBeGreaterThanOrEqual(1)
        expect(res.sale.potd).toBeBoolean()

        expect(request.validateImage(res.brand.logo)).toBeTrue()
        expect(res.brand.name).not.toBeEmpty()
        expect(res.brand.description).not.toBeEmpty()

        expect(res.title).not.toBeEmpty()
        expect(res.returnDays).toBeNumber()

        if (res.returnable) {
            expect(res.returnable).toBeBoolean()
        }

        expect(res.description.heading).not.toBeEmpty()
        expect(res.description.secondary).toBeArray()

        for (const [key, value] of Object.entries(res.images)) {
            value.forEach(value => {
                request.validateImage(value)
            })
        }

        expect(res.products).toBeArray()

        for (let product of res.products) {
            try {
                expect(product.id).not.toBeEmpty()
                expect(product.nsId).not.toBeEmpty()
                expect(product.saleId).not.toBeEmpty()
                expect(product.retailPrice).toBeGreaterThanOrEqual(product.salePrice)
                expect(product.inStock).toBeBoolean()
                // expect(product.quantity).toBeGreaterThanOrEqual(0)
                expect(product.quantity).toBeNumber()
                expect(Object.keys(res.images)).toContainEqual(product.imageKey)
                expect(product.isVirtual).toBeBoolean()
                expect(product.isBulky).toBeBoolean()
            } catch (error) {
                throw { failed_product_content: product, error: error }
            }
        }

        expect(res.sizes).toBeArray()
        expect(res.colors).toBeArray()
    } catch (error) {
        throw { failed_product: product, error: error }
    }
}

export const ProductInfoTest = () => {
    it('GET / invalid product ID', async () => {
        let res = await request.get(config.api.product + 'INVALID-ID')

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('COULD_NOT_LOAD_PRODUCT')
    })

    it('GET / product of sale not started (skip-prod)', async () => {
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

            expect(res.statusCode).toEqual(404)
            expect(res.body.message).toEqual('SALE_NOT_FOUND')
        } catch (err) {
            throw err
        } finally {
            // reset date on Redis
            redisItem['event']['startDate'] = originalStart
            await accessRedis.setValue('productId:' + products[0].id, JSON.stringify(redisItem))
        }
    })

    it('GET / product of sale ended (skip-prod)', async () => {
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

            expect(res.statusCode).toEqual(404)
            expect(res.body.message).toEqual('SALE_HAS_ENDED')
        } catch (err) {
            throw err
        } finally {
            // reset date on Redis
            redisItem['event']['endDate'] = originalEnd
            await accessRedis.setValue('productId:' + products[0].id, JSON.stringify(redisItem))
        }
    })

    it.each([[config.api.currentSales],
    [config.api.todaySales],
    [config.api.featuredSales],
    [config.api.internationalSales],
    [config.api.cateAccessories + '/sales/current'],
    [config.api.cateApparel + '/sales/current'],
    [config.api.cateBagsShoes + '/sales/current'],
    [config.api.cateHealthBeauty + '/sales/current'],
    [config.api.cateHomeLifeStyle + '/sales/current']])
        ('GET / valid product from sale %s', async (saleType) => {
            let products = await request.getProducts(saleType)
            expect(products.length).toBeGreaterThanOrEqual(1)

            for (let i = 0; i < 15; i++) {
                const random = Math.floor(Math.random() * products.length)
                await validateProductInfo(products[random])
            }
        })

    it('GET / valid product from POTD', async () => {
        let products = await request.getProducts(config.api.potdSales)
        expect(products.length).toBeGreaterThanOrEqual(1)

        for (let product of products) {
            let res = await request.getProductInfo(product.id)
            expect(res.sale.potd).toBeTrue()

            await validateProductInfo(product)
        }
    })

    it('GET / sold out product', async () => {
        let product = await request.getSoldOutProductInfo(config.api.currentSales)

        for (let item of product.products) {
            expect(item.inStock).toBeFalse()
            expect(item.quantity).toBeLessThanOrEqual(0)
        }
        if (product.sizes.length > 0) {
            for (let size of product.sizes) {
                expect(size.soldOut).toBeTrue()
            }
        }
        if (product.colors.length > 0) {
            for (let color of product.colors) {
                expect(color.soldOut).toBeTrue()
            }
        }
    })

    it('GET / product with sizes', async () => {
        product = await request.getProductInfoWithSizes(config.api.cateApparel + '/sales/current')

        for (let size of product.sizes) {
            expect(size.availableColors).toBeArray()
            expect(size.name).not.toBeEmpty()
            expect(size.quantity).toBeNumber()
            expect(size.soldOut).toBeBoolean()
        }
    })

    it('GET / product with colors', async () => {
        product = await request.getProductInfoWithColors(config.api.cateApparel + '/sales/current')

        for (let color of product.colors) {
            expect(color.availableSizes).toBeArray()
            expect(color.hex).toBeString()
            expect(color.name).not.toBeEmpty()
            expect(color.soldOut).toBeBoolean()

            let res = await request.get(config.api.product + 'view-product/' +
                product.id + '/' + encodeURIComponent(color.name))
            expect(res.statusCode).toEqual(200)
        }
    })

    it('GET / product with no color and size', async () => {
        product = await request.getProductInfoNoColorSize(config.api.currentSales)

        expect(request.validateImage(product.images['All'][0])).toBeTrue()
        expect(product.products[0].imageKey).toEqual('All')
    })
}

describe('Product API ' + config.baseUrl + config.api.product, ProductInfoTest)