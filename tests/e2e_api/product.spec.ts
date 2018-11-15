import config from '../../config/config'
import { Utils } from '../../common'
import 'jest-extended'
let request = new Utils()

describe('Product API ' + config.baseUrl + config.api.product + '/<productID>', () => {
    test('GET / product info - wrong product ID', async () => {
        let response = await request.get(config.api.product + '5b0fd3bf1e73c50001f6fcee')
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_LOAD_PRODUCT')
    })

    test('GET / product info - sale ended', async () => {
        let response = await request.get(config.api.product + '5b0fd3bf1e73c50001f6fced')
        expect(response.status).toEqual(410)
        expect(response.data.message).toEqual('SALE_HAS_ENDED')
    })

    test('GET / product info - valid product ID', async () => {
        let products = await request.getProducts(config.api.featuredSales)

        for (let product of products) {
            let response = await request.getProductInfo(product.id)
            expect(response.id).toEqual(product.id)

            expect(response.sale.slug).not.toBeEmpty()
            expect(new Date(response.sale.startTime).getTime()).toBeLessThanOrEqual(new Date(response.sale.endTime).getTime())
            expect(response.sale.categories.length).toBeGreaterThanOrEqual(1)
            expect(response.sale.potd).toBeBoolean()

            expect(response.brand.logo).toMatch(/https:\/\/leflair-assets.storage.googleapis.com\/.+.jpg/)
            expect(response.brand.name).not.toBeEmpty()
            expect(response.brand.description).not.toBeEmpty()

            expect(response.title).not.toBeEmpty()
            expect(response.returnable).toBeBoolean()
            expect(response.returnDays).toBeNumber()

            expect(response.description.heading).not.toBeEmpty()
            expect(response.description.secondary).toBeArray()
            expect(response.description.materialCare).toBeArray()

            expect(response.images.All).toBeArray()

            expect(response.products).toBeArray()
            for (let product of response.products) {
                expect(product.id).not.toBeEmpty()
                expect(product.saleId).not.toBeEmpty()
                expect(product.retailPrice).toBeGreaterThan(product.salePrice)
                expect(product.inStock).toBeBoolean()
                expect(product.quantity).toBeGreaterThanOrEqual(0)
                expect(product.imageKey).toEqual('All')
                expect(product.isVirtual).toBeBoolean()
                expect(product.isBulky).toBeBoolean()
            }

            expect(response.sizes).toBeArray()
            expect(response.colors).toBeArray()
        }
    })

    test('GET / product with sizes', async () => {
        let product = await request.getProductWithSizes(config.api.currentSales)
        expect(product.sizes.length).toBeGreaterThanOrEqual(1)
        for (let size of product.sizes) {
            expect(size.availableColors).toBeArray()
            expect(size.name).not.toBeEmpty()
            expect(size.quantity).toBeNumber()
            expect(size.soldOut).toBeBoolean()
        }
    })

    test('GET / product with colors', async () => {
        let product = await request.getProductWithColors(config.api.currentSales)
        expect(product.colors.length).toBeGreaterThanOrEqual(2)
        for (let color of product.colors) {
            expect(color.availableSizes).toBeArray()
            expect(color.hex).not.toBeEmpty()
            expect(color.name).not.toBeEmpty()
            expect(color.soldOut).toBeBoolean()

            let response = await request.get(config.api.product + 'view-product/' + product.id + '/' + color.name)
            expect(response.status).toEqual(200)
        }
    })
})