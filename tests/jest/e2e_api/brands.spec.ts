import config from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as model from '../../../common/interface'
let brands: model.brands

describe('Sale info API ' + config.baseUrl + '/api/v2/home/<saleType>', () => {
    it('GET / get brands directory', async () => {
        let response = await request.get(config.api.brands)
        brands = response.data
        expect(response.status).toEqual(200)

        for (let item of Object.keys(brands)) {
            let brand: model.BrandItem
            for (brand of brands[item]) {
                try {
                    expect(brand.id).not.toBeEmpty()
                    expect(brand.name).not.toBeEmpty()
                    expect(brand.slug).toInclude(brand.id)
                } catch (error) {
                    throw { failed_brand: brand, error: error }
                }
            }
        }
    })

    it('GET / get brand with no product', async () => {
        let brand = await request.getBrandWithNoProduct()
        expect(brand.id).not.toBeEmpty()
        expect(brand.name).not.toBeEmpty()
        expect(brand.description).not.toBeEmpty()

        if (Object.keys(brand.meta).length > 0) {
            expect(brand.meta.title).not.toBeEmpty()
            expect(brand.meta.description).not.toBeEmpty()
            expect(brand.meta.content).not.toBeEmpty()
        } else {
            expect(brand.meta).toBeObject()
        }

        expect(brand.products).toBeArrayOfSize(0)
    })

    it('GET / get brand with products', async () => {
        let brand = await request.getBrandWithProducts(config.api.potdSales)
        expect(brand.id).not.toBeEmpty()
        expect(brand.name).not.toBeEmpty()
        expect(brand.description).not.toBeEmpty()

        if (Object.keys(brand.meta).length > 0) {
            expect(brand.meta.title).not.toBeEmpty()
            expect(brand.meta.description).not.toBeEmpty()
            expect(brand.meta.content).not.toBeEmpty()
        } else {
            expect(brand.meta).toBeObject()
        }

        for (let product of brand.products) {
            try {
                expect(product.id).not.toBeEmpty()
                expect(product.brand).toEqual(brand.name)
                expect(product.image.toLowerCase()).toMatch(/.+\.jpg|\.jpeg|\.png/)
                expect(product.image2.toLowerCase()).toMatch(/.+\.jpg|\.jpeg|\.png/)
                expect(product.numberOfVariations).toBeNumber()
                expect(product.quantity).toBeNumber()
                expect(product.queryParams).toInclude('?')
                expect(product.retailPrice).toBeGreaterThanOrEqual(product.salePrice)
                expect(product.slug).toInclude(product.id)
                expect(product.soldOut).toBeBoolean()
                expect(product.title).not.toBeEmpty()
            } catch (error) {
                throw { failed_product: product, error: error }
            }
        }
    })
})
