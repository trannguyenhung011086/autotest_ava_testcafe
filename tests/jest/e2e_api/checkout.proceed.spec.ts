import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as Model from '../../../common/interface'
let account: Model.Account
let checkout: Model.Checkout
let item: Model.Product
let cart: Model.Cart
let addresses: Model.Addresses
let cookie: string

export const CheckoutProceedTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
        await request.addAddresses()
        addresses = await request.getAddresses()
        account = await request.getAccountInfo()
    })

    afterEach(async () => {
        await request.emptyCart()
    })

    it('GET / proceed checkout with empty cart', async () => {
        let response = await request.get(config.api.checkout)
        checkout = response.data

        expect(response.status).toEqual(200)
        expect(checkout.accountCredit).toEqual(account.accountCredit)
        expect(checkout.cart).toBeArrayOfSize(0)
        expect(checkout.creditCards).toBeArray()
    })

    it('GET / proceed checkout with cart', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.get(config.api.checkout)
        checkout = response.data

        expect(response.status).toEqual(200)
        expect(checkout.accountCredit).toEqual(account.accountCredit)
        expect(checkout.creditCards).toBeArray()
        expect(checkout.cart).toContainEqual(cart)
    })
}

describe('Checkout API - Logged in - Proceed ' + config.baseUrl
    + config.api.checkout, CheckoutProceedTest)