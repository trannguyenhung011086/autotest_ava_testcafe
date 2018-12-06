import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as Model from '../../common/interface'
let account: Model.Account
let checkout: Model.Checkout
let item: Model.Product
let cart: Model.Cart
let addresses: Model.Addresses
let cookie: string

describe('Checkout API - Logged in - Proceed ' + config.baseUrl + config.api.cart, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    test('GET / proceed checkout with empty cart', async () => {
        let response = await request.get(config.api.checkout, cookie)
        checkout = response.data

        expect(response.status).toEqual(200)
        expect(checkout.accountCredit).toEqual(account.accountCredit)
        expect(checkout.cart).toBeArrayOfSize(0)
        expect(checkout.creditCards).toBeArray()
    })

    test('GET / proceed checkout with cart', async () => {
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