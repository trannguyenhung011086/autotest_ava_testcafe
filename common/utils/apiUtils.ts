import { config } from '../../config'
import * as Model from '../interface'
import { GotUtils } from './gotUtils'
import { MongoUtils } from './mongoUtils'
import * as faker from "faker/locale/vi"

export class ApiUtils extends GotUtils {
    constructor() {
        super()
    }
    public async getLogInCookie(email: string = config.testAccount.email,
        password = config.testAccount.password): Promise<string> {
        const data: Object = {
            email: email,
            password: password
        }

        let cookie = await this.post(config.api.signIn, data)
            .then(res => res.headers['set-cookie'][0])

        if (!cookie) {
            throw 'Cannot get login cookie!'
        }
        return cookie
    }

    public async getGuestCookie(): Promise<string> {
        let cookie = await this.get(config.api.account)
            .then(res => res.headers['set-cookie'][0])

        if (!cookie) {
            throw 'Cannot get guest cookie!'
        }
        return cookie
    }

    public async getAccountInfo(cookie?: string): Promise<Model.Account> {
        let res = await this.get(config.api.account, cookie)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot get account info!',
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async emptyCart(cookie?: string) {
        let account = await this.getAccountInfo(cookie)
        let deletedList = []

        if (account.cart.length > 0) {
            for (let item of account.cart) {
                deletedList.push(item.id)
            }

            let res = await this.put(config.api.cart + 'delete-multiple',
                { "cartItemIds": deletedList }, cookie)

            if (res.statusCode != 200) {
                throw {
                    message: 'Cannot remove from cart!',
                    error: JSON.stringify(res.body, null, '\t')
                }
            }
            return res.body
        }
    }

    public async addToCart(productId: string, cookie?: string, check?: boolean): Promise<Model.Cart> {
        let res = await this.post(config.api.cart, {
            "productId": productId
        }, cookie)

        if (check && res.statusCode != 200) {
            throw {
                message: 'Cannot add to cart: ' + productId,
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async updateQuantityCart(cartId: string, quantity: number, cookie?: string): Promise<Model.Cart> {
        let res = await this.put(config.api.cart + cartId, {
            "quantity": quantity
        }, cookie)

        if (res.statusCode != 200) {
            throw {
                message: 'Cannot update quantity: ' + cartId,
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async getSales(saleType: string): Promise<Model.SalesModel[]> {
        const res = await this.get(saleType)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot get sales from ' + saleType,
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async getUpcomingSales(): Promise<Model.UpcomingSalesModel[]> {
        const res = await this.get(config.api.upcomingSales)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot get upcoming sales!',
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async getSaleInfo(saleId: string): Promise<Model.SaleInfoModel> {
        const res = await this.get(config.api.sales + saleId)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot get info from sale: ' + saleId,
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
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
        const sales = await this.getSales(saleType)
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
            const saleInfo = await this.getSaleInfo(sale['id'])

            for (let product of saleInfo.products) {
                productList.push(product)
            }
        }

        return productList
    }

    public async getBestSellers(): Promise<Model.BestSellers[]> {
        const res = await this.get(config.api.bestSellers)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot get bestsellers!',
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async getProductInfoWithSizes(saleType: string): Promise<Model.ProductInfoModel> {
        let products = await this.getProducts(saleType)

        let result: Model.ProductInfoModel
        for (let product of products) {
            let res = await this.getProductInfo(product.id)
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
            let res = await this.getProductInfo(product.id)
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
            if (matched.length >= 10) {
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
                if (result.length >= 10) {
                    break
                }
            }
        }

        if (result.length == 0) {
            throw 'There is no product with stock from ' + saleType
        }
        return result
    }

    public async getSoldOutProductInfo(saleType: string): Promise<Model.ProductInfoModel> {
        let products = await this.getProducts(saleType)
        let matched: Model.Products[] = []

        for (let product of products) {
            if (product.soldOut == true) {
                matched.push(product)
            }
        }

        let result: Model.ProductInfoModel
        for (let item of matched) {
            let info = await this.getProductInfo(item.id)
            let soldOut = info.products.every((input) => {
                return input.inStock == false
            })
            if (soldOut == true) {
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
        let sales = await new MongoUtils().getSaleList({
            country: country,
            startDate: { $lt: new Date() },
            endDate: { $gte: new Date() }
        })
        let inStockList = []

        for (let sale of sales) {
            let saleInfo = await this.getSaleInfo(sale._id)

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

    public async getAddresses(cookie?: string): Promise<Model.Addresses> {
        try {
            let res = await this.get(config.api.addresses, cookie)
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get address list!',
                error: JSON.stringify(e, null, '\t')
            }
        }
    }

    public async getCities(): Promise<Model.City[]> {
        try {
            let res = await this.get(config.api.addresses + '/cities')
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get city list!',
                error: JSON.stringify(e, null, '\t')
            }
        }

    }

    public async getDistricts(cityId: string): Promise<Model.District[]> {
        try {
            let res = await this.get(config.api.addresses + '/cities/' + cityId + '/districts')
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get district list!',
                ererror: JSON.stringify(e, null, '\t')
            }
        }
    }

    public getCity(cities: Model.City[]): Model.City {
        if (!cities) {
            throw 'City list has error!'
        }
        return this.getArrayRandomElement(cities)
    }

    public getDistrict(districts: Model.District[]): Model.District {
        if (!districts) {
            throw 'City list has error!'
        }
        return this.getArrayRandomElement(districts)
    }

    public getArrayRandomElement(arr: any[]) {
        if (arr && arr.length) {
            return arr[Math.floor(Math.random() * arr.length)];
        }
    }

    public async deleteAddresses(cookie?: string): Promise<void> {
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
            throw {
                message: 'Cannot delete address!',
                ererror: JSON.stringify(e, null, '\t')
            }
        }
    }

    public async addAddresses(cookie?: string) {
        let cities = await this.getCities()
        let shipping = await this.generateAddress('shipping', cities)
        shipping.duplicateBilling = true
        let res = await this.post(config.api.addresses, shipping, cookie)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot add address!',
                error: JSON.stringify(res.body, null, '\t')
            }
        }
    }

    public async generateAddress(addressType: string, cities: Model.City[]) {
        let city = await this.getCity(cities)
        let districts = await this.getDistricts(city.id)
        let district = await this.getDistrict(districts)
        let address: Model.Shipping = {
            address: 'QA_' + faker.address.streetAddress(),
            city: city,
            default: true,
            district: district,
            firstName: 'QA_' + faker.name.firstName(),
            lastName: 'QA_' + faker.name.lastName(),
            phone: faker.phone.phoneNumber().replace(/ /g, '')
        }
        if (addressType == 'shipping') {
            address.type = 'shipping'
        }
        if (addressType == 'billing') {
            address.type = 'billing'
            address.companyName = 'QA_' + faker.company.companyName()
            address.taxCode = '1234567890'
        }
        return address
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
        let products = await this.getProducts(saleType)
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

    public async getOrders(cookie?: string): Promise<Model.OrderSummary[]> {
        try {
            let res = await this.get(config.api.orders, cookie)
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get order list!',
                error: JSON.stringify(e, null, '\t')
            }
        }
    }

    public async getOrderInfo(orderId: string, cookie?: string): Promise<Model.Order> {
        try {
            let res = await this.get(config.api.orders + '/' + orderId, cookie)
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get order info of ' + orderId,
                error: JSON.stringify(e, null, '\t')
            }
        }
    }

    public async getSplitOrderInfo(orderCode: string, cookie?: string): Promise<Model.Order[]> {
        try {
            let res = await this.get(config.api.orders + '/' + orderCode, cookie)
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get order info of ' + orderCode,
                error: JSON.stringify(e, null, '\t')
            }
        }
    }

    public async getCards(cookie?: string): Promise<Model.CreditCard[]> {
        try {
            let res = await this.get(config.api.creditcard, cookie)
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get card list!',
                error: JSON.stringify(e, null, '\t')
            }
        }
    }

    public async getCard(provider: string, cookie?: string): Promise<string> {
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
            throw 'No saved CC found for ' + provider
        }
        return matchedCard
    }

    public async parsePayDollarRes(content: string): Promise<Model.PayDollarResponse> {
        try {
            let result: any = content.split('&').reduce((result, value) => {
                result[value.split('=')[0]] = value.split('=')[1]
                return result
            }, {})
            return result
        } catch (e) {
            throw e
        }
    }

    public async failedAttempt(orderCode: string, cookie?: string): Promise<Model.FailedAttempt> {
        let res = await this.post(config.api.checkout + '/order/failed-attempt', {
            "errorMsg": "invalid card",
            "orderCode": orderCode
        }, cookie)

        if (res.statusCode != 200) {
            throw {
                message: 'Cannot execute failed-attempt checkout',
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async checkoutPayDollar(info: Model.CheckoutInput, cookie?: string): Promise<Model.CheckoutOrder> {
        let data = {
            "address": {
                "shipping": info.addresses.shipping[0],
                "billing": info.addresses.billing[0]
            },
            "cart": info.account.cart,
            "method": "CC",
            "shipping": 0
        }
        if (info.saveNewCard) {
            data['saveCard'] = info.saveNewCard
        }
        if (info.voucherId) {
            data['voucher'] = info.voucherId
        }
        if (info.credit) {
            data['accountCredit'] = info.credit
        }
        if (info.methodData) {
            data['methodData'] = info.methodData
        }

        let res = await this.post(config.api.checkout, data, cookie)

        if (res.statusCode != 200) {
            throw {
                message: 'Cannot complete PayDollar checkout',
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async checkoutCod(info: Model.CheckoutInput, cookie?: string): Promise<Model.CheckoutOrder> {
        let data = {
            "address": {
                "shipping": info.addresses.shipping[0],
                "billing": info.addresses.billing[0]
            },
            "cart": info.account.cart,
            "method": "COD",
            "shipping": 25000
        }
        if (info.voucherId) {
            data['voucher'] = info.voucherId
        }
        if (info.credit) {
            data['accountCredit'] = info.credit
        }

        let res = await this.post(config.api.checkout, data, cookie)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot complete COD checkout',
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async checkoutStripe(info: Model.CheckoutInput, cookie?: string): Promise<Model.CheckoutOrder> {
        let data = {
            "address": {
                "shipping": info.addresses.shipping[0],
                "billing": info.addresses.billing[0]
            },
            "cart": info.account.cart,
            "method": "STRIPE",
            "methodData": info.stripeSource,
            "shipping": 0
        }
        if (info.saveNewCard) {
            data['saveCard'] = info.saveNewCard
        }
        if (info.voucherId) {
            data['voucher'] = info.voucherId
        }
        if (info.credit) {
            data['accountCredit'] = info.credit
        }
        if (info.methodData) {
            data['methodData'] = info.methodData
        }

        let res = await this.post(config.api.checkout, data, cookie)

        if (res.statusCode != 200) {
            throw {
                message: 'Cannot complete STRIPE checkout',
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async createFailedAttemptOrder(items: Model.Product[], cookie?: string): Promise<Model.FailedAttempt> {
        for (let item of items) {
            await this.addToCart(item.id, cookie)
        }

        let info: Model.CheckoutInput
        info = {}
        info.account = await this.getAccountInfo(cookie)
        info.addresses = await this.getAddresses(cookie)

        let checkout = await this.checkoutPayDollar(info, cookie)

        let payDollarCreditCard = checkout.creditCard
        payDollarCreditCard.cardHolder = 'testing card'
        payDollarCreditCard.cardNo = '4111111111111111'
        payDollarCreditCard.pMethod = 'VISA'
        payDollarCreditCard.epMonth = 7
        payDollarCreditCard.epYear = 2020
        payDollarCreditCard.securityCode = '123'
        payDollarCreditCard.transactionUrl = config.payDollarBase + config.payDollarApi
        payDollarCreditCard.failUrl = 'https://secure.leflair.vn/checkout'
        payDollarCreditCard.successUrl = 'https://secure.leflair.vn/checkout/thank-you/' + checkout.code

        let res = await this.postFormUrl(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        console.log(res.headers)

        let parse = await this.parsePayDollarRes(res.body)

        if (parse.successcode != '1') {
            throw 'Cannot create failed-attempt order!'
        }

        let failedAttempt = await this.failedAttempt(parse.Ref, cookie)
        return failedAttempt
    }
}