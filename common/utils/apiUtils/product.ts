import { config } from '../../config'
import * as Model from '../../interface'
import { Helper } from '../helper'
import { DbAccessUtils } from '../mongoUtils/access'
import { SaleUtils } from './sale'

export class ProductUtils extends Helper {
    constructor() {
        super()
    }

    public async getProductInfo(productId: string): Promise<Model.ProductInfoModel> {
        const res = await this.get(config.api.product + productId)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot get info from product: ' + productId,
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async getProducts(saleType: string, crossBorder?: string): Promise<Model.Products[]> {
        let sales = await new SaleUtils().getSales(saleType)

        // filter out invalid sale on staging
        sales = sales.reduce((result, value) => {
            const exclude = [
                '5c6662dbd76f7144bf5872b5',
                '5c6bd1967486a8220646498c',
                '5c766fc25422f9b23f34beba'
            ]
            if (!exclude.includes(value.id)) {
                result.push(value)
            }
            return result
        }, [])

        let saleList = []
        let domestic = []
        let international = []
        let productList = []

        for (let sale of sales) {
            if (sale.international === true) {
                international.push(sale)
            } else {
                domestic.push(sale)
            }
        }

        if (saleType == config.api.internationalSales || crossBorder == 'international') {
            saleList = international
        } else {
            saleList = domestic
        }

        for (let sale of saleList) {
            const saleInfo = await new SaleUtils().getSaleInfo(sale.id)

            for (let product of saleInfo.products) {
                productList.push(product)
            }
        }

        return productList
    }

    public async getProductInfoWithSizes(saleType: string): Promise<Model.ProductInfoModel> {
        let products = await this.getProducts(saleType)

        let result: Model.ProductInfoModel
        for (let product of products) {
            const res = await this.getProductInfo(product.id)
            if (res.sizes.length > 1) {
                result = res
                break
            }
        }

        if (!result) {
            throw 'Cannot get product with sizes from ' + saleType
        }
        return result
    }

    public async getProductInfoWithColors(saleType: string): Promise<Model.ProductInfoModel> {
        let products = await this.getProducts(saleType)

        let result: Model.ProductInfoModel
        for (let product of products) {
            const res = await this.getProductInfo(product.id)
            if (res.colors.length > 1) {
                result = res
                break
            }
        }

        if (!result) {
            throw 'Cannot get product with colors from ' + saleType
        }
        return result
    }

    public async getProductInfoNoColorSize(saleType: string): Promise<Model.ProductInfoModel> {
        let products = await this.getProducts(saleType)

        let result: Model.ProductInfoModel
        for (let product of products) {
            const res = await this.getProductInfo(product.id)
            if (res.colors.length == 0 && res.sizes.length == 0) {
                result = res
                break
            }
        }

        if (!result) {
            throw 'Cannot get product with no color and size from ' + saleType
        }
        return result
    }

    public async getInStockProduct(saleType: string, quantity: number, price?: number): Promise<Model.Product> {
        let products = await this.getProducts(saleType)
        let matched: Model.Products[] = []

        for (let product of products) {
            if (product.soldOut == false) {
                matched.push(product)
            }
            if (matched.length >= 10) {
                break
            }
        }

        let result: Model.Product
        for (let item of matched) {
            let info = await this.getProductInfo(item.id)

            for (let product of info.products) {
                if (price && product.salePrice >= price && product.quantity >= quantity) {
                    result = product
                    break
                } else if (!price && product.quantity >= quantity) {
                    result = product
                    break
                }
            }
        }

        if (!result) {
            throw `There is no product ${saleType} satisfying the conditions!`
        }
        return result
    }

    public async getInStockProducts(saleType: string, quantity: number, price?: number): Promise<Model.Product[]> {
        let products = await this.getProducts(saleType)
        let matched: Model.Products[] = []

        for (let product of products) {
            if (product.soldOut == false) {
                matched.push(product)
            }
            if (matched.length >= 15) {
                break
            }
        }

        let result: Model.Product[] = []
        for (let item of matched) {
            let info = await this.getProductInfo(item.id)

            for (let product of info.products) {
                if (price && product.salePrice >= price && product.quantity >= quantity) {
                    result.push(product)
                } else if (!price && product.quantity >= quantity) {
                    result.push(product)
                }
                if (result.length >= 15) {
                    break
                }
            }
        }

        if (result.length == 0) {
            throw 'There is no product with stock from ' + saleType
        }
        return result
    }

    public async getInStockProductInfo(saleType: string): Promise<Model.ProductInfoModel> {
        let products = await this.getProducts(saleType)
        let matched: Model.Products[] = []

        for (let product of products) {
            if (product.soldOut !== true) {
                matched.push(product)
            }
        }

        let result: Model.ProductInfoModel
        for (let item of matched) {
            let info = await this.getProductInfo(item.id)
            let inStock = info.products.every((input) => {
                return input.inStock === true
            })
            if (inStock === true) {
                result = info
                break
            }
        }

        if (!result) {
            throw 'There is no in stock product from ' + saleType
        }
        return result
    }

    public async getSoldOutProductInfo(saleType: string): Promise<Model.ProductInfoModel> {
        let products = await this.getProducts(saleType)
        let matched: Model.Products[] = []

        for (let product of products) {
            if (product.soldOut === true) {
                matched.push(product)
            }
        }

        let result: Model.ProductInfoModel
        for (let item of matched) {
            let info = await this.getProductInfo(item.id)
            let soldOut = info.products.every((input) => {
                return input.inStock === false
            })
            if (soldOut === true) {
                result = info
                break
            }
        }

        if (!result) {
            throw 'There is no sold out product from ' + saleType
        }
        return result
    }

    public async getProductWithCountry(country: string, minPrice: number, maxPrice: number): Promise<Model.Product> {
        let sales = await new DbAccessUtils().getSaleList({
            country: country,
            startDate: { $lt: new Date() },
            endDate: { $gte: new Date() }
        })
        let inStockList = []

        for (let sale of sales.slice(0, 3)) {
            let saleInfo = await new SaleUtils().getSaleInfo(sale._id)

            saleInfo.products.forEach(product => {
                if (product.soldOut === false &&
                    product.salePrice >= minPrice &&
                    product.salePrice <= maxPrice) {
                    inStockList.push(product)
                }
            })
        }

        if (inStockList.length == 0) {
            throw `There is no product with stock from ${country}!`
        }

        let info = await this.getProductInfo(inStockList[0].id)

        for (let product of info.products) {
            if (product.inStock === true) {
                return product
            }
        }
    }
}