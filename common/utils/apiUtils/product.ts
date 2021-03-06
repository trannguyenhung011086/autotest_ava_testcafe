import { config } from "../../config";
import * as Model from "../../interface";
import { Helper } from "../helper";
import { DbAccessUtils } from "../mongoUtils/access";
import { SaleUtils } from "./sale";

export class ProductUtils extends Helper {
    constructor() {
        super();
    }

    public async getProductInfo(
        productId: string
    ): Promise<Model.ProductInfoModel> {
        const res = await this.get(config.api.product + productId);
        if (res.statusCode != 200) {
            throw {
                message: "Cannot get info from product: " + productId,
                error: JSON.stringify(res.body, null, "\t")
            };
        }
        return res.body;
    }

    public async getProducts(
        saleType: string,
        crossBorder?: string
    ): Promise<Model.Products[]> {
        let sales = await new SaleUtils().getSales(saleType);

        // filter out invalid sale on staging
        sales = sales.reduce((result, value) => {
            const exclude = [
                "5c6662dbd76f7144bf5872b5",
                "5c6bd1967486a8220646498c",
                "5c766fc25422f9b23f34beba"
            ];
            if (!exclude.includes(value.id)) {
                result.push(value);
            }
            return result;
        }, []);

        let saleList = [];
        const domestic = [];
        const international = [];
        const productList = [];

        for (const sale of sales) {
            if (sale.international === true) {
                international.push(sale);
            } else {
                domestic.push(sale);
            }
        }

        if (
            saleType == config.api.internationalSales ||
            crossBorder == "international"
        ) {
            saleList = international;
        } else {
            saleList = domestic;
        }

        if (saleList.length == 0 && domestic.length == 0) {
            saleList = international;
        }

        for (const sale of saleList) {
            const saleInfo = await new SaleUtils().getSaleInfo(sale.id);

            for (const product of saleInfo.products) {
                productList.push(product);
            }
        }

        return productList;
    }

    public async getProductInfoWithSizes(
        saleType: string
    ): Promise<Model.ProductInfoModel> {
        const products = await this.getProducts(saleType);

        let result: Model.ProductInfoModel;
        for (const product of products) {
            const res = await this.getProductInfo(product.id);
            if (res.sizes.length > 1) {
                result = res;
                break;
            }
        }

        if (!result) {
            throw "Cannot get product with sizes from " + saleType;
        }
        return result;
    }

    public async getProductInfoWithColors(
        saleType: string
    ): Promise<Model.ProductInfoModel> {
        const products = await this.getProducts(saleType);

        let result: Model.ProductInfoModel;
        for (const product of products) {
            const res = await this.getProductInfo(product.id);
            if (res.colors.length > 1) {
                result = res;
                break;
            }
        }

        if (!result) {
            throw "Cannot get product with colors from " + saleType;
        }
        return result;
    }

    public async getProductInfoNoColorSize(
        saleType: string
    ): Promise<Model.ProductInfoModel> {
        const products = await this.getProducts(saleType);

        let result: Model.ProductInfoModel;
        for (const product of products) {
            const res = await this.getProductInfo(product.id);
            if (res.colors.length == 0 && res.sizes.length == 0) {
                result = res;
                break;
            }
        }

        if (!result) {
            throw "Cannot get product with no color and size from " + saleType;
        }
        return result;
    }

    public async getInStockProduct(
        saleType: string,
        quantity: number,
        price?: number
    ): Promise<Model.Product> {
        const products = await this.getProducts(saleType);
        const matched: Model.Products[] = [];

        for (const product of products) {
            if (product.soldOut == false) {
                matched.push(product);
            }
            if (matched.length >= 10) {
                break;
            }
        }

        let result: Model.Product;
        for (const item of matched) {
            const info = await this.getProductInfo(item.id);

            for (const product of info.products) {
                if (
                    price &&
                    product.inStock === true &&
                    product.salePrice >= price &&
                    product.quantity >= quantity
                ) {
                    result = product;
                    break;
                } else if (
                    !price &&
                    product.inStock === true &&
                    product.quantity >= quantity
                ) {
                    result = product;
                    break;
                }
            }
        }

        if (!result) {
            throw `There is no product ${saleType} satisfying the conditions!`;
        }
        return result;
    }

    public async getInStockProducts(
        saleType: string,
        quantity: number,
        price?: number
    ): Promise<Model.Product[]> {
        const products = await this.getProducts(saleType);
        const matched: Model.Products[] = [];

        for (const product of products) {
            if (product.soldOut == false) {
                matched.push(product);
            }
            if (matched.length >= 15) {
                break;
            }
        }

        const result: Model.Product[] = [];
        for (const item of matched) {
            const info = await this.getProductInfo(item.id);

            for (const product of info.products) {
                if (
                    price &&
                    product.inStock === true &&
                    product.salePrice >= price &&
                    product.quantity >= quantity
                ) {
                    result.push(product);
                } else if (
                    !price &&
                    product.inStock === true &&
                    product.quantity >= quantity
                ) {
                    result.push(product);
                }
                if (result.length >= 15) {
                    break;
                }
            }
        }

        if (result.length == 0) {
            throw "There is no product with stock from " + saleType;
        }
        return result;
    }

    public async getInStockProductInfo(
        saleType: string
    ): Promise<Model.ProductInfoModel> {
        const products = await this.getProducts(saleType);
        const matched: Model.Products[] = [];

        for (const product of products) {
            if (product.soldOut !== true) {
                matched.push(product);
            }
        }

        let result: Model.ProductInfoModel;
        for (const item of matched) {
            const info = await this.getProductInfo(item.id);
            const inStock = info.products.every(input => {
                return input.inStock === true && input.quantity > 0;
            });
            if (inStock === true) {
                result = info;
                break;
            }
        }

        if (!result) {
            throw "There is no in stock product from " + saleType;
        }
        return result;
    }

    public async getSoldOutProductInfo(
        saleType: string
    ): Promise<Model.ProductInfoModel> {
        const products = await this.getProducts(saleType);
        const matched: Model.Products[] = [];

        for (const product of products) {
            if (product.soldOut === true) {
                matched.push(product);
            }
        }

        let result: Model.ProductInfoModel;
        for (const item of matched) {
            const info = await this.getProductInfo(item.id);
            const soldOut = info.products.every(input => {
                return input.inStock === false && input.quantity === 0;
            });
            if (soldOut === true) {
                result = info;
                break;
            }
        }

        if (!result) {
            throw "There is no sold out product from " + saleType;
        }
        return result;
    }

    public async getProductWithCountry(
        country: string,
        minPrice: number,
        maxPrice: number
    ): Promise<Model.Product> {
        const sales = await new DbAccessUtils().getSaleList({
            country: country,
            startDate: { $lt: new Date() },
            endDate: { $gte: new Date() }
        });
        const inStockList = [];

        for (const sale of sales.slice(0, 3)) {
            const saleInfo = await new SaleUtils().getSaleInfo(sale._id);

            saleInfo.products.forEach(product => {
                if (
                    product.soldOut === false &&
                    product.salePrice >= minPrice &&
                    product.salePrice <= maxPrice
                ) {
                    inStockList.push(product);
                }
            });
        }

        if (inStockList.length == 0) {
            throw `There is no product with stock from ${country}!`;
        }

        const info = await this.getProductInfo(inStockList[0].id);

        for (const product of info.products) {
            if (product.inStock === true) {
                return product;
            }
        }
    }

    public async getVirtualProductInfo(country: string, virtual: boolean) {
        const sales = await new DbAccessUtils().getSaleList({
            country: country,
            startDate: { $lt: new Date() },
            endDate: { $gte: new Date() }
        });
        const inStockList = [];

        for (const sale of sales.slice(0, 3)) {
            const saleInfo = await new SaleUtils().getSaleInfo(sale._id);

            saleInfo.products.forEach(product => {
                if (product.soldOut === false) {
                    inStockList.push(product);
                }
            });
        }

        if (inStockList.length == 0) {
            throw `There is no product with stock from ${country}!`;
        }

        for (const item of inStockList) {
            const info = await this.getProductInfo(item.id);

            const checkVirtual = info.products.every(
                product =>
                    product.inStock === true && product.isVirtual === true
            );

            if (virtual && checkVirtual) {
                return info;
            } else if (!virtual && !checkVirtual) {
                return info;
            }
        }
    }

    public async getVirtualBulkyProductInfo(
        saleType: string,
        virtual: boolean,
        bulky: boolean
    ): Promise<Model.ProductInfoModel> {
        const products = await this.getProducts(saleType);
        const matched: Model.Products[] = [];

        for (const product of products) {
            if (product.soldOut !== true) {
                matched.push(product);
            }
        }

        let result: Model.ProductInfoModel;
        for (const item of matched) {
            const info = await this.getProductInfo(item.id);

            if (virtual && !bulky) {
                const isVirtual = info.products.every(input => {
                    return input.isVirtual === true && input.isBulky === false;
                });

                if (isVirtual) {
                    result = info;
                }
            } else if (!virtual && bulky) {
                const isBulky = info.products.every(input => {
                    return input.isVirtual === false && input.isBulky === true;
                });

                if (isBulky) {
                    result = info;
                }
            } else if (virtual && bulky) {
                const isVirtualBulky = info.products.every(input => {
                    return input.isVirtual === true && input.isBulky === true;
                });

                if (isVirtualBulky) {
                    result = info;
                }
            } else if (!virtual && !bulky) {
                const notVirtualBulky = info.products.every(input => {
                    return input.isVirtual === false && input.isBulky === false;
                });

                if (notVirtualBulky) {
                    result = info;
                }
            }

            if (result) {
                break;
            }
        }

        if (!result) {
            throw "There is no product satisfied the condition from " +
                saleType;
        }
        return result;
    }
}
