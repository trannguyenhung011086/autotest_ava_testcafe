import config from '../../config/config'
import * as Model from '../interface'
import AxiosUtils from './axiosUtils'
import * as faker from "faker/locale/vi"
import { doesNotReject } from 'assert';

export default class ApiUtils extends AxiosUtils {
    constructor() {
        super()
    }
    public async getLogInCookie(email: string = config.testAccount.email,
        password = config.testAccount.password): Promise<string> {
        const data: Object = {
            email: email,
            password: password
        }
        return await this.post(config.api.login, data)
            .then(response => response.headers['set-cookie'][0])
    }

    public async getGuestCookie(): Promise<string> {
        return await this.get(config.api.account)
            .then(response => response.headers['set-cookie'][0])
    }

    public async getAccountInfo(cookie: string): Promise<Model.Account> {
        let response = await this.get(config.api.account, cookie)
        return response.data
    }

    public async emptyCart(cookie: string): Promise<void> {
        let response = await this.get(config.api.account, cookie)
        let account: Model.Account = response.data
        if (account.cart.length >= 1) {
            for (let item of account.cart) {
                await this.delete(config.api.cart + item.id)
            }
        }
    }

    public async addToCart(productId: string, cookie: string): Promise<Model.Cart> {
        let response = await this.post(config.api.cart, { "productId": productId }, cookie)
        // if (response.status != 200) {
        //     throw { message: 'Cannot add to cart: ' + productId, error: response.data }
        // }
        return response.data
    }

    public async updateQuantityCart(cartId: string, quantity: number, cookie: string): Promise<Model.Cart> {
        let response = await this.put(config.api.cart + cartId, { "quantity": quantity }, cookie)
        if (response.status != 200) {
            throw { message: 'Cannot update quantity: ' + cartId, error: response.data }
        }
        return response.data
    }

    public async getSales(saleType: string): Promise<Model.SalesModel[]> {
        const r = await this.get(saleType)
        if (r.status != 200) {
            throw r.data
        }
        return r.data
    }

    public async getUpcomingSales(): Promise<Model.UpcomingSalesModel[]> {
        const r = await this.get(config.api.upcomingSales)
        if (r.status != 200) {
            throw r.data
        }
        return r.data
    }

    public async getSaleInfo(saleId: string): Promise<Model.SaleInfoModel> {
        const r = await this.get(config.api.sales + saleId)
        if (r.status != 200) {
            throw r.data
        }
        return r.data
    }

    public async getProductInfo(productId: string): Promise<Model.ProductInfoModel> {
        const r = await this.get(config.api.product + productId)
        if (r.status != 200) {
            throw r.data
        }
        return r.data
    }

    public async getProducts(saleType: string, productType?: string): Promise<Model.Products[]> {
        const sales = await this.getSales(saleType)
        let domestic = []
        let international = []

        sales.forEach(sale => {
            if (sale.international == false) {
                domestic.push(sale)
            } else if (sale.international == true) {
                international.push(sale)
            }
        })

        if (productType == 'international' || saleType == config.api.internationalSales) {
            if (international.length == 0) {
                throw 'There is no international sale!'
            }
            const saleInfo = await this.getSaleInfo(international[0]['id'])
            return saleInfo.products
        } else {
            if (domestic.length == 0) {
                throw 'There is no domestic sale!'
            }
            const saleInfo = await this.getSaleInfo(domestic[0]['id'])
            return saleInfo.products
        }
    }

    public async getSaleWithManyProducts(saleType: string, amount: number = 90) {
        const sales = await this.getSales(saleType)
        var matched: Model.SalesModel
        for (let sale of sales) {
            var saleInfo = await this.getSaleInfo(sale['id'])
            var products = saleInfo.products
            if (products.length > amount) {
                matched = sale
                break
            }
        }
        if (matched == undefined) {
            throw `There is no sale with ${amount} products!`
        }
        return matched
    }

    public async getBestSellers(): Promise<Model.BestSellers[]> {
        const r = await this.get(config.api.bestSellers)
        if (r.status != 200) {
            throw r.data
        }
        return r.data
    }

    public async getProductWithSizes(saleType: string): Promise<Model.ProductInfoModel> {
        let products = await this.getProducts(saleType)
        for (let product of products) {
            let response = await this.getProductInfo(product.id)
            if (response.sizes.length >= 1) {
                return response
            }
        }
    }

    public async getProductWithColors(saleType: string): Promise<Model.ProductInfoModel> {
        let products = await this.getProducts(saleType)
        for (let product of products) {
            let response = await this.getProductInfo(product.id)
            if (response.colors.length >= 2) {
                return response
            }
        }
    }

    public async getProductWithNoSizeNoColor(saleType: string): Promise<Model.ProductInfoModel> {
        let products = await this.getProducts(saleType)
        for (let product of products) {
            let response = await this.getProductInfo(product.id)
            if (response.sizes.length == 0 && response.colors.length == 0) {
                return response
            }
        }
    }

    public async getInStockProduct(saleType: string, quantity: number): Promise<Model.Product> {
        let products = await this.getProducts(saleType)
        let matched: Model.Products

        for (let product of products) {
            if (product.soldOut == false) {
                matched = product
                break
            }
        }

        let info = await this.getProductInfo(matched.id)
        for (let product of info.products) {
            if (product.quantity >= quantity) {
                return product
            }
        }
    }

    public async getInStockProducts(saleType: string, quantity: number): Promise<Model.Product[]> {
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

        let result: Model.Product[] = []
        for (let item of matched) {
            let info = await this.getProductInfo(item.id)
            for (let product of info.products) {
                if (product.quantity >= quantity) {
                    result.push(product)
                }
                if (result.length >= 10) {
                    break
                }
            }
        }
        return result
    }

    public async getSoldOutProduct(saleType: string): Promise<Model.ProductInfoModel> {
        let products = await this.getProducts(saleType)
        let matched: Model.Products[] = []

        for (let product of products) {
            if (product.soldOut == true) {
                matched.push(product)
            }
        }

        for (let item of matched) {
            let info = await this.getProductInfo(item.id)
            let soldOut = info.products.every((input) => {
                return input.inStock == false
            })
            if (soldOut == true) {
                return info
            }
        }
    }

    public async getAddresses(cookie: string): Promise<Model.Addresses> {
        try {
            let response = await this.get(config.api.addresses, cookie)
            return response.data
        } catch (e) {
            throw 'Current account cannot access address list!'
        }
    }

    public async getCities(): Promise<Model.City[]> {
        let response = await this.get(config.api.addresses + '/cities')
        return response.data
    }

    public async getDistricts(cityId: string): Promise<Model.District[]> {
        let response = await this.get(config.api.addresses + '/cities/' + cityId + '/districts')
        return response.data
    }

    public getCity(cities: Model.City[]): Model.City {
        return this.getArrayRandomElement(cities)
    }

    public getDistrict(districts: Model.District[]): Model.District {
        return this.getArrayRandomElement(districts)
    }

    public getArrayRandomElement(arr: any[]) {
        if (arr && arr.length) {
            return arr[Math.floor(Math.random() * arr.length)];
        }
    }

    public async deleteAddresses(cookie: string): Promise<void> {
        let addresses = await this.getAddresses(cookie)
        try {
            if (addresses.billing.length > 0) {
                for (let billing of addresses.billing) {
                    await this.delete(config.api.addresses + '/' + billing.id, cookie)
                }
            }
            if (addresses.shipping.length > 0) {
                for (let shipping of addresses.shipping) {
                    await this.delete(config.api.addresses + '/' + shipping.id, cookie)
                }
            }
        } catch (e) {
            throw e
        }
    }

    public async addAddresses(cookie: string) {
        let cities = await this.getCities()
        let shipping = await this.generateAddress('shipping', cities)
        shipping.duplicateBilling = true
        let response = await this.post(config.api.addresses, shipping, cookie)
        if (response.status != 200) {
            throw 'Cannot add address!'
        }
    }

    public async generateAddress(addressType: string, cities: Model.City[]) {
        let city = await this.getCity(cities)
        let districts = await this.getDistricts(city.id)
        let district = await this.getDistrict(districts)
        let address: Model.Shipping = {
            address: faker.address.streetAddress(),
            city: city,
            default: true,
            district: district,
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            phone: faker.phone.phoneNumber().replace(/ /g, '')
        }
        if (addressType == 'shipping') {
            address.type = 'shipping'
        }
        if (addressType == 'billing') {
            address.type = 'billing'
            address.companyName = faker.company.companyName()
            address.taxCode = '1234567890'
        }
        return address
    }

    public async getBrandsList(): Promise<Model.BrandItem[]> {
        let response = await this.get(config.api.brands)
        let brands: Model.brands = response.data
        let brandList = []
        for (let item of Object.keys(brands)) {
            let brand: Model.BrandItem
            for (brand of brands[item]) {
                brandList.push(brand)
            }
        }
        return brandList
    }

    public async getBrandWithNoProduct(): Promise<Model.BrandInfo> {
        let brandList = await this.getBrandsList()
        for (let brand of brandList) {
            let response = await this.get(config.api.brands + brand.id)
            let brandInfo: Model.BrandInfo
            brandInfo = response.data
            if (brandInfo.products.length == 0) {
                return brandInfo
            }
        }
    }

    public async getBrandWithProducts(): Promise<Model.BrandInfo> {
        let products = await this.getProducts(config.api.featuredSales)
        let brandList = await this.getBrandsList()
        for (let item of brandList) {
            if (item.name == products[0].brand) {
                let response = await this.get(config.api.brands + item.id)
                let brandInfo: Model.BrandInfo
                brandInfo = response.data
                return brandInfo
            }
        }
    }

    public async getOrders(cookie: string): Promise<Model.OrderSummary[]> {
        let response = await this.get(config.api.orders, cookie)
        return response.data
    }

    public async getOrderInfo(orderId: string, cookie: string): Promise<Model.Order> {
        let response = await this.get(config.api.orders + '/' + orderId, cookie)
        return response.data
    }
}