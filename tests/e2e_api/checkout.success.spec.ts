import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as Model from '../../common/interface'
let account: Model.Account
let creditcard: Model.CreditCardModel
let checkout: Model.Checkout
let item: Model.Product
let cart: Model.Cart
let addresses: Model.Addresses
let customer: Model.Customer
let cookie: string

describe('Checkout API - Logged in - Success ' + config.baseUrl + config.api.cart, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
        customer = await access.getCustomerInfo({ email: account.email })
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    test('GET / access checkout with empty cart', async () => {
        let response = await request.get(config.api.checkout, cookie)
        checkout = response.data
        expect(response.status).toEqual(200)
        expect(checkout.accountCredit).toEqual(account.accountCredit)
        expect(checkout.cart).toBeArrayOfSize(0)
        expect(checkout.creditCards).toBeArray()
    })

    test('GET / access checkout with cart', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data

        response = await request.get(config.api.checkout, cookie)
        checkout = response.data
        expect(response.status).toEqual(200)
        expect(checkout.accountCredit).toEqual(account.accountCredit)
        expect(checkout.creditCards).toBeArray()
        expect(checkout.cart).toContainEqual(cart)
    })

    test('POST / checkout with COD - domestic product', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart([item.id], cookie)
        account = await request.getAccountInfo(cookie)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 0,
            "accountCredit": 0
        }, cookie)

        expect(response.status).toEqual(200)
        expect(response.data.orderId).not.toBeEmpty()
        expect(response.data.code).not.toBeEmpty()

        let orders = await request.getOrders(cookie)
        expect(orders[0].code).toInclude(response.data.code)
    })

    test('POST / checkout with CC - domestic product', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart([item.id], cookie)
        account = await request.getAccountInfo(cookie)

        checkout = (await request.get(config.api.checkout, cookie)).data
        let matchedCard: string
        for (let card of checkout.creditCards) {
            if (!card.provider) {
                matchedCard = card.id
                break
            }
        }

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "CC",
            "methodData": matchedCard,
            "saveCard": true,
            "shipping": 0,
            "accountCredit": 0,
            "email": "test1234@test.com"
        }, cookie)

        expect(response.status).toEqual(200)
        expect(response.data.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(response.data.orderId, cookie)
        expect(response.data.creditCard.orderRef).toInclude(order.code)
    })
})