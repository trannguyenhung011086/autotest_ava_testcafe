import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as model from '../../../common/interface'

let product: model.ProductInfoModel

let request = new Utils.ProductUtils
let access = new Utils.DbAccessUtils

export const ProductInfoTest = () => {
    it('GET / invalid product ID', async () => {
        let res = await request.get(config.api.product + 'INVALID-ID')

        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('PRODUCT_NOT_FOUND')
    })

    it('GET / product of sale not started', async () => {
        let futureSale = await access.getSale({
            startDate: { $gt: new Date() },
            products: { $ne: [] }
        })
        let res = await request.get(config.api.product + futureSale.products[0].product)

        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('PRODUCT_NOT_FOUND')
    })

    it('GET / product of sale ended', async () => {
        let endedSale = await access.getSale({
            endDate: { $lt: new Date() },
            products: { $ne: [] }
        })
        let res = await request.get(config.api.product + endedSale.products[0].product)

        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('PRODUCT_NOT_FOUND')
    })

    it('GET / valid product ID', async () => {
        let products = await request.getProducts(config.api.featuredSales)
        expect(products.length).toBeGreaterThanOrEqual(1)

        for (let product of products) {
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

                expect(res.images).toBeObject()

                expect(res.products).toBeArray()

                for (let product of res.products) {
                    try {
                        expect(product.id).not.toBeEmpty()
                        expect(product.saleId).not.toBeEmpty()
                        expect(product.retailPrice).toBeGreaterThanOrEqual(product.salePrice)
                        expect(product.inStock).toBeBoolean()
                        expect(product.quantity).toBeGreaterThanOrEqual(0)
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
                product.id + '/' + color.name)
            expect(res.statusCode).toEqual(200)
        }
    })
}

describe('Product API ' + config.baseUrl + config.api.product, ProductInfoTest)