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

export const CheckoutProceedLoggedInTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    afterAll(async () => {
        await request.deleteAddresses(cookie)
    })

    it('GET / proceed checkout with empty cart', async () => {
        let res = await request.get(config.api.checkout, cookie)
        checkout = res.body

        expect(res.statusCode).toEqual(200)
        expect(checkout.accountCredit).toEqual(account.accountCredit)
        expect(checkout.cart).toBeArrayOfSize(0)
        expect(checkout.creditCards).toBeArray()
    })

    it('GET / proceed checkout with cart', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.get(config.api.checkout, cookie)
        checkout = res.body

        expect(res.statusCode).toEqual(200)
        expect(checkout.accountCredit).toEqual(account.accountCredit)
        expect(checkout.creditCards).toBeArray()
        expect(checkout.cart).toContainEqual(cart)
    })
}

export const CheckoutProceedGuestTest = () => {
    beforeAll(async () => {
        cookie = await request.getGuestCookie()
        account = await request.getAccountInfo(cookie)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    it('GET / proceed checkout with empty cart', async () => {
        let res = await request.get(config.api.checkout, cookie)
        checkout = res.body

        expect(res.statusCode).toEqual(200)
        expect(checkout.cart).toBeArrayOfSize(0)
        expect(checkout.creditCards).toBeArray()
    })

    it('GET / proceed checkout with cart', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.get(config.api.checkout, cookie)
        checkout = res.body

        expect(res.statusCode).toEqual(200)
        expect(checkout.creditCards).toBeArray()
        expect(checkout.cart).toContainEqual(cart)
    })
}

describe('Checkout API - Proceed (Logged In) ' + config.baseUrl
    + config.api.checkout, CheckoutProceedLoggedInTest)

describe('Checkout API - Proceed (Guest) ' + config.baseUrl
    + config.api.checkout, CheckoutProceedGuestTest)