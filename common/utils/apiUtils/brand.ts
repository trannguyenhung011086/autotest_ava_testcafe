import { config } from "../../config";
import * as Model from "../../interface";
import { Helper } from "../helper";
import { ProductUtils } from "./product";

export class BrandUtils extends Helper {
    constructor() {
        super();
    }

    public async getBrandsList(): Promise<Model.BrandItem[]> {
        const res = await this.get(config.api.brands);
        const brands: Model.brands = res.body;
        const brandList = [];

        for (const item of Object.keys(brands)) {
            for (const brand of brands[item]) {
                brandList.push(brand);
            }
        }

        if (!brandList) {
            throw "Cannot get brand list!";
        }
        return brandList;
    }

    public async getBrandWithNoProduct(): Promise<Model.BrandInfo> {
        const brandList = await this.getBrandsList();
        let result: Model.BrandInfo;

        for (const brand of brandList) {
            const res = await this.get(config.api.brands + brand.id);
            if (res.body.products.length == 0) {
                result = res.body;
                break;
            }
        }

        if (!result) {
            throw "Cannot get brand with no product!";
        }
        return result;
    }

    public async getBrandWithProducts(
        saleType = config.api.featuredSales
    ): Promise<Model.BrandInfo> {
        const products = await new ProductUtils().getProducts(saleType);
        const brandList = await this.getBrandsList();

        let result: Model.BrandInfo;
        for (const item of brandList) {
            if (item.name == products[0].brand) {
                const res = await this.get(config.api.brands + item.id);
                result = res.body;
                break;
            }
        }

        if (!result) {
            throw "Cannot get brand with products from " + saleType;
        }
        return result;
    }
}
