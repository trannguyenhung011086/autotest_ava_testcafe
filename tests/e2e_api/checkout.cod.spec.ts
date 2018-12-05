import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as Model from '../../common/interface'
let account: Model.Account
let item: Model.Product
let cart: Model.Cart
let addresses: Model.Addresses
let cookie: string

describe('Checkout API - Logged in - Success ' + config.baseUrl + config.api.cart, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    test('POST / cannot checkout with COD - international product', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id, cookie)
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

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('International orders must be paid by credit card. Please refresh the page and try again.')
    })

    test('POST / cannot checkout with COD - domestic + international product', async () => {
        let item1 = await request.getInStockProduct(config.api.internationalSales, 1)
        let item2 = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item1.id, cookie)
        await request.addToCart(item2.id, cookie)
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

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('International orders must be paid by credit card. Please refresh the page and try again.')
    })

    test('POST / checkout with COD - domestic product', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item.id, cookie)
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

        let order = await request.getOrderInfo(response.data.orderId, cookie)
        expect(order.code).toInclude(response.data.code)
    })
})