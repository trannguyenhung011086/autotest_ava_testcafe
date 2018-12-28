import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as model from '../../common/interface'
let product: model.ProductInfoModel

describe('Product API ' + config.baseUrl + config.api.product + '<productID>', () => {
    test('GET / invalid product ID', async () => {
        let response = await request.get(config.api.product + 'INVALID-ID')
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_LOAD_PRODUCT')
    })

    test('GET / product of sale not started', async () => {
        let futureSale = await access.getSale({
            startDate: { $gt: new Date() }
        })
        let response = await request.get(config.api.product + futureSale.products[0].product)
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('SALE_NOT_FOUND')
    })

    test('GET / product of sale ended', async () => {
        let endedSale = await access.getSale({
            endDate: { $lt: new Date() }
        })
        let response = await request.get(config.api.product + endedSale.products[0].product)
        expect(response.status).toEqual(410)
        expect(response.data.message).toEqual('SALE_HAS_ENDED')
    })

    test('GET / valid product ID', async () => {
        let products = await request.getProducts(config.api.featuredSales)
        expect(products.length).toBeGreaterThanOrEqual(1)

        for (let product of products) {
            try {
                let response = await request.getProductInfo(product.id)
                expect(response.id).toEqual(product.id)

                expect(response.sale.slug).not.toBeEmpty()
                expect(new Date(response.sale.startTime)).toBeBefore(new Date(response.sale.endTime))
                expect(response.sale.categories.length).toBeGreaterThanOrEqual(1)
                expect(response.sale.potd).toBeBoolean()

                expect(response.brand.logo.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)
                expect(response.brand.name).not.toBeEmpty()
                expect(response.brand.description).not.toBeEmpty()

                expect(response.title).not.toBeEmpty()
                expect(response.returnable).toBeBoolean()
                expect(response.returnDays).toBeNumber()

                expect(response.description.heading).not.toBeEmpty()
                expect(response.description.secondary).toBeArray()

                expect(response.images).toBeObject()

                expect(response.products).toBeArray()

                for (let product of response.products) {
                    try {
                        expect(product.id).not.toBeEmpty()
                        expect(product.saleId).not.toBeEmpty()
                        expect(product.retailPrice).toBeGreaterThanOrEqual(product.salePrice)
                        expect(product.inStock).toBeBoolean()
                        expect(product.quantity).toBeGreaterThanOrEqual(0)
                        expect(Object.keys(response.images)).toContainEqual(product.imageKey)
                        expect(product.isVirtual).toBeBoolean()
                        expect(product.isBulky).toBeBoolean()
                    } catch (error) {
                        throw { failed_product_content: product, error: error }
                    }
                }

                expect(response.sizes).toBeArray()
                expect(response.colors).toBeArray()
            } catch (error) {
                throw { failed_product: product, error: error }
            }
        }
    })

    test('GET / sold out product', async () => {
        let product = await request.getSoldOutProduct(config.api.todaySales)

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

    test('GET / product with sizes', async () => {
        product = await request.getProductWithSizes(config.api.currentSales)

        for (let size of product.sizes) {
            expect(size.availableColors).toBeArray()
            expect(size.name).not.toBeEmpty()
            expect(size.quantity).toBeNumber()
            expect(size.soldOut).toBeBoolean()
        }
    })

    test('GET / product with colors', async () => {
        product = await request.getProductWithColors(config.api.currentSales)

        for (let color of product.colors) {
            expect(color.availableSizes).toBeArray()
            expect(color.hex).toBeString()
            expect(color.name).not.toBeEmpty()
            expect(color.soldOut).toBeBoolean()

            let response = await request.get(config.api.product + 'view-product/' +
                product.id + '/' + color.name)
            expect(response.status).toEqual(200)
        }
    })
})