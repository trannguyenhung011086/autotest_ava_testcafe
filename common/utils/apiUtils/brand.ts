import { config } from '../../config'
import * as Model from '../../interface'
import { Helper } from '../helper'
import { ProductUtils } from './product'

export class BrandUtils extends Helper {
    constructor() {
        super()
    }

    public async getBrandsList(): Promise<Model.BrandItem[]> {
        let res = await this.get(config.api.brands)
        let brands: Model.brands = res.body
        let brandList = []
        for (let item of Object.keys(brands)) {
            let brand: Model.BrandItem
            for (brand of brands[item]) {
                brandList.push(brand)
            }
        }

        if (!brandList) {
            throw 'Cannot get brand list!'
        }
        return brandList
    }

    public async getBrandWithNoProduct(): Promise<Model.BrandInfo> {
        let brandList = await this.getBrandsList()

        let result: Model.BrandInfo
        for (let brand of brandList) {
            let res = await this.get(config.api.brands + brand.id)
            if (res.body.products.length == 0) {
                result = res.body
                break
            }
        }

        if (!result) {
            throw 'Cannot get brand with no product!'
        }
        return result
    }

    public async getBrandWithProducts(saleType = config.api.featuredSales): Promise<Model.BrandInfo> {
        let products = await new ProductUtils().getProducts(saleType)
        let brandList = await this.getBrandsList()

        let result: Model.BrandInfo
        for (let item of brandList) {
            if (item.name == products[0].brand) {
                let res = await this.get(config.api.brands + item.id)
                result = res.body
                break
            }
        }

        if (!result) {
            throw 'Cannot get brand with products from ' + saleType
        }
        return result
    }
}