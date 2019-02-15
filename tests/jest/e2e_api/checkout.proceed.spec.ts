import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let account: Model.Account
let checkout: Model.Checkout
let item: Model.Product
let cart: Model.Cart
let cookie: string

let helper = new Utils.Helper
let requestAddress = new Utils.AddressUtils
let requestAccount = new Utils.AccountUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils

export const CheckoutProceedLoggedInTest = () => {
    beforeAll(async () => {
        cookie = await helper.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
        account = await requestAccount.getAccountInfo(cookie)
    })

    afterEach(async () => {
        await requestCart.emptyCart(cookie)
    })

    afterAll(async () => {
        await requestAddress.deleteAddresses(cookie)
    })

    it('GET / proceed checkout with empty cart', async () => {
        let res = await helper.get(config.api.checkout, cookie)
        checkout = res.body

        expect(res.statusCode).toEqual(200)
        expect(checkout.accountCredit).toEqual(account.accountCredit)
        expect(checkout.cart).toBeArrayOfSize(0)
        expect(checkout.creditCards).toBeArray()
    })

    it('GET / proceed checkout with cart', async () => {
        item = await requestProduct.getInStockProduct(config.api.featuredSales, 1)

        let res = await helper.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await helper.get(config.api.checkout, cookie)
        checkout = res.body

        expect(res.statusCode).toEqual(200)
        expect(checkout.accountCredit).toEqual(account.accountCredit)
        expect(checkout.creditCards).toBeArray()
        expect(checkout.cart).toContainEqual(cart)
    })
}

export const CheckoutProceedGuestTest = () => {
    beforeAll(async () => {
        cookie = await helper.getGuestCookie()
        account = await requestAccount.getAccountInfo(cookie)
    })

    afterEach(async () => {
        await requestCart.emptyCart(cookie)
    })

    it('GET / proceed checkout with empty cart', async () => {
        let res = await helper.get(config.api.checkout, cookie)
        checkout = res.body

        expect(res.statusCode).toEqual(200)
        expect(checkout.cart).toBeArrayOfSize(0)
        expect(checkout.creditCards).toBeArray()
    })

    it('GET / proceed checkout with cart', async () => {
        item = await requestProduct.getInStockProduct(config.api.featuredSales, 1)

        let res = await helper.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await helper.get(config.api.checkout, cookie)
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