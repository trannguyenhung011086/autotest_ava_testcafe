import config from '../../config/config'
import * as Model from '../interface'
import AxiosUtils from './axiosUtils'
import MongoUtils from './mongoUtils'
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

    public async emptyCart(cookie: string) {
        let account = await this.getAccountInfo(cookie)
        let deletedList = []

        if (account.cart.length > 0) {
            for (let item of account.cart) {
                deletedList.push(item.id)
            }

            let response = await this.put(config.api.cart + 'delete-multiple',
                { "cartItemIds": deletedList }, cookie)

            if (response.status != 200) {
                throw { message: 'Cannot remove from cart!', error: response.data }
            }
            return response.data
        }
    }

    public async addToCart(productId: string, cookie: string, check = true): Promise<Model.Cart> {
        let response = await this.post(config.api.cart, { "productId": productId }, cookie)
        if (check && response.status != 200) {
            throw { message: 'Cannot add to cart: ' + productId, error: response.data }
        }
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

        if (matched.length == 0) {
            throw new Error(`There is no product with stock from ${saleType}`)
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
            throw new Error('There is no product with stock!')
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
            if (matched.length >= 10) {
                break
            }
        }

        if (matched.length == 0) {
            throw new Error(`There is no product with stock from ${saleType}`)
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

    public async getCards(cookie: string): Promise<Model.CreditCard[]> {
        let response = await this.get(config.api.creditcard, cookie)
        return response.data
    }

    public async getCard(provider: string, cookie: string): Promise<string> {
        let creditCards = await this.getCards(cookie)
        let matchedCard: string

        for (let card of creditCards) {
            if (provider == 'PayDollar' && !card.provider) {
                matchedCard = card.id
                break
            }
            if (provider == 'Stripe' && card.provider) {
                matchedCard = card.id
                break
            }
        }

        if (!matchedCard) {
            throw new Error('No saved CC found for this test!')
        }
        return matchedCard
    }

    public async parsePayDollarRes(content: string): Promise<Model.PayDollarResponse> {
        let result: any = content.split('&').reduce((result, value) => {
            result[value.split('=')[0]] = value.split('=')[1]
            return result
        }, {})
        return result
    }

    public async failedAttempt(orderCode: string, cookie: string): Promise<Model.FailedAttempt> {
        let response = await this.post(config.api.checkout + '/order/failed-attempt', {
            "errorMsg": "invalid card",
            "orderCode": orderCode
        }, cookie)

        if (response.status != 200) {
            throw { message: 'Cannot execute failed-attempt checkout', error: response.data }
        }
        return response.data
    }

    public async checkoutPayDollar(account: Model.Account, addresses: Model.Addresses,
        cookie: string, saveNewCard?: boolean, voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        let data = {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "CC",
            "shipping": 0
        }
        if (saveNewCard) {
            data['saveCard'] = saveNewCard
        }
        if (voucherId) {
            data['voucher'] = voucherId
        }
        if (credit) {
            data['accountCredit'] = credit
        }

        let response = await this.post(config.api.checkout, data, cookie)
        if (response.status != 200) {
            throw { message: 'Cannot execute checkout', error: response.data }
        }
        return response.data
    }

    public async reCheckoutPayDollar(failedAttemptOrder: Model.FailedAttempt,
        addresses: Model.Addresses, cookie: string, saveNewCard?: boolean,
        voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        let data = {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": [
                {
                    "id": failedAttemptOrder.products[0].id,
                    "quantity": failedAttemptOrder.products[0].quantity,
                    "salePrice": failedAttemptOrder.products[0].salePrice
                }
            ],
            "method": "CC",
            "shipping": 0
        }
        if (saveNewCard) {
            data['saveCard'] = saveNewCard
        }
        if (voucherId) {
            data['voucher'] = voucherId
        }
        if (credit) {
            data['accountCredit'] = credit
        }

        let response = await this.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, data, cookie)

        if (response.status != 200) {
            throw { message: 'Cannot execute re-checkout', error: response.data }
        }
        return response.data
    }

    public async checkoutSavedPayDollar(account: Model.Account, addresses: Model.Addresses,
        cookie: string, cardId: string, voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        let data = {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "CC",
            "methodData": cardId,
            "shipping": 0
        }
        if (voucherId) {
            data['voucher'] = voucherId
        }
        if (credit) {
            data['accountCredit'] = credit
        }

        let response = await this.post(config.api.checkout, data, cookie)
        if (response.status != 200) {
            throw { message: 'Cannot execute checkout', error: response.data }
        }
        return response.data
    }

    public async reCheckoutSavedPayDollar(failedAttemptOrder: Model.FailedAttempt,
        addresses: Model.Addresses, cookie: string, cardId: string,
        voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        let data = {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": [
                {
                    "id": failedAttemptOrder.products[0].id,
                    "quantity": failedAttemptOrder.products[0].quantity,
                    "salePrice": failedAttemptOrder.products[0].salePrice
                }
            ],
            "method": "CC",
            "methodData": cardId,
            "shipping": 0
        }
        if (voucherId) {
            data['voucher'] = voucherId
        }
        if (credit) {
            data['accountCredit'] = credit
        }

        let response = await this.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, data, cookie)

        if (response.status != 200) {
            throw { message: 'Cannot execute re-checkout', error: response.data }
        }
        return response.data
    }

    public async checkoutCod(account: Model.Account, addresses: Model.Addresses,
        cookie: string, voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        let data = {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000
        }
        if (voucherId) {
            data['voucher'] = voucherId
        }
        if (credit) {
            data['accountCredit'] = credit
        }

        let response = await this.post(config.api.checkout, data, cookie)
        if (response.status != 200) {
            throw { message: 'Cannot execute checkout', error: response.data }
        }
        return response.data
    }

    public async reCheckoutCod(failedAttemptOrder: Model.FailedAttempt,
        addresses: Model.Addresses, cookie: string,
        voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        let data = {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": [
                {
                    "id": failedAttemptOrder.products[0].id,
                    "quantity": failedAttemptOrder.products[0].quantity,
                    "salePrice": failedAttemptOrder.products[0].salePrice
                }
            ],
            "method": "COD",
            "shipping": 25000
        }
        if (voucherId) {
            data['voucher'] = voucherId
        }
        if (credit) {
            data['accountCredit'] = credit
        }

        let response = await this.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, data, cookie)

        if (response.status != 200) {
            throw { message: 'Cannot execute re-checkout', error: response.data }
        }
        return response.data
    }

    public async checkoutStripe(account: Model.Account, addresses: Model.Addresses,
        cookie: string, stripeSource: any, saveNewCard?: boolean,
        voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        let data = {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "STRIPE",
            "methodData": stripeSource,
            "shipping": 0
        }
        if (saveNewCard) {
            data['saveCard'] = saveNewCard
        }
        if (voucherId) {
            data['voucher'] = voucherId
        }
        if (credit) {
            data['accountCredit'] = credit
        }

        let response = await this.post(config.api.checkout, data, cookie)
        if (response.status != 200) {
            throw { message: 'Cannot execute checkout', error: response.data }
        }
        return response.data
    }

    public async checkoutSavedStripe(account: Model.Account, addresses: Model.Addresses,
        cookie: string, cardId: string, voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        let data = {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "STRIPE",
            "methodData": cardId,
            "shipping": 0
        }
        if (voucherId) {
            data['voucher'] = voucherId
        }
        if (credit) {
            data['accountCredit'] = credit
        }

        let response = await this.post(config.api.checkout, data, cookie)
        if (response.status != 200) {
            throw { message: 'Cannot execute checkout', error: response.data }
        }
        return response.data
    }

    public async createFailedAttemptOrder(cookie: string, items: Model.Product[]): Promise<Model.FailedAttempt> {
        for (let item of items) {
            await this.addToCart(item.id, cookie)
        }
        let account = await this.getAccountInfo(cookie)
        let addresses = await this.getAddresses(cookie)

        let checkout = await this.checkoutPayDollar(account, addresses, cookie)

        let payDollarCreditCard = checkout.creditCard
        payDollarCreditCard.cardHolder = 'testing card'
        payDollarCreditCard.cardNo = '5422882800700006'
        payDollarCreditCard.pMethod = 'Master'
        payDollarCreditCard.epMonth = 7
        payDollarCreditCard.epYear = 2020
        payDollarCreditCard.securityCode = '123'

        let result = await this.postFormUrl(config.payDollarBase, config.payDollarApi, payDollarCreditCard)
        let parse = await this.parsePayDollarRes(result.data)

        if (parse.successcode != '1') {
            throw new Error('Transaction is not failed. Cannot create failed-attempt order!')
        }

        let failedAttempt = await this.failedAttempt(parse.Ref, cookie)
        return failedAttempt
    }

    public async createCodOrder(cookie: string, items: Model.Product[], voucherId?: string,
        credit?: number): Promise<Model.CheckoutOrder> {

        for (let item of items) {
            await this.addToCart(item.id, cookie)
        }
        let account = await this.getAccountInfo(cookie)
        let addresses = await this.getAddresses(cookie)

        return await this.checkoutCod(account, addresses, cookie, voucherId, credit)
    }

    public async createPayDollarOrder(cookie: string, items: Model.Product[], saveNewCard?: boolean,
        voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        for (let item of items) {
            await this.addToCart(item.id, cookie)
        }
        let account = await this.getAccountInfo(cookie)
        let addresses = await this.getAddresses(cookie)

        return await this.checkoutPayDollar(account, addresses, cookie, saveNewCard, voucherId, credit)
    }

    public async createSavedPayDollarOrder(cookie: string, items: Model.Product[],
        cardId: string, voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        for (let item of items) {
            await this.addToCart(item.id, cookie)
        }
        let account = await this.getAccountInfo(cookie)
        let addresses = await this.getAddresses(cookie)

        return await this.checkoutSavedPayDollar(account, addresses, cookie, cardId, voucherId, credit)
    }

    public async createStripeOrder(cookie: string, items: Model.Product[], stripeSource: any,
        saveNewCard?: boolean, voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        for (let item of items) {
            await this.addToCart(item.id, cookie)
        }
        let account = await this.getAccountInfo(cookie)
        let addresses = await this.getAddresses(cookie)

        return await this.checkoutStripe(account, addresses, cookie, stripeSource, saveNewCard, voucherId, credit)
    }

    public async createSavedStripeOrder(cookie: string, items: Model.Product[],
        cardId: string, voucherId?: string, credit?: number): Promise<Model.CheckoutOrder> {

        for (let item of items) {
            await this.addToCart(item.id, cookie)
        }
        let account = await this.getAccountInfo(cookie)
        let addresses = await this.getAddresses(cookie)

        return await this.checkoutSavedStripe(account, addresses, cookie, cardId, voucherId, credit)
    }
}