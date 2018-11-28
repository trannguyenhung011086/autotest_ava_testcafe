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
let cookie: string

describe('Checkout API - Logged in - Success ' + config.baseUrl + config.api.cart, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        account = await request.getAccountInfo(cookie)
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
})