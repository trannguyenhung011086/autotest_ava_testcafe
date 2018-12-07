import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as Model from '../../common/interface'
let account: Model.Account
let item: Model.Product
let creditCards: Model.CreditCard[]
let addresses: Model.Addresses
let cookie: string
const stripe = require('stripe')(config.stripeKey)

const stripeData = {
    "type": "card",
    "card[cvc]": "222",
    "card[exp_month]": "02",
    "card[exp_year]": "22",
    "guid": "d7954ec1-b754-4de9-aff1-47f65a90f988",
    "muid": "4f81e594-2a7c-4ddb-b966-db9db589e63f",
    "sid": "4f81e594-2a7c-4ddb-b966-db9db589e63f",
    "pasted_fields": "number",
    "payment_user_agent": "stripe.js/596ce0d0; stripe-js-v3/596ce0d0",
    "referrer": "https://secure.staging.leflair.io/checkout?language=vn",
    "key": config.stripeKey
}

describe('Checkout API - Logged in - Stripe ' + config.baseUrl + config.api.checkout, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    test.skip('POST / cannot checkout with Stripe - domestic product', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        stripeData['card[number]'] = '4000000000000077'
        const stripeSource = await stripe.sources.create(stripeData)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "STRIPE",
            "methodData": stripeSource
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('Domestic orders cannot be paid by Stripe. Please refresh the page and try again.')
    }) // wait for WWW-372

    test('POST / cannot checkout with insufficient Stripe', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        stripeData['card[number]'] = '4000000000009995'
        const stripeSource = await stripe.sources.create(stripeData)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "STRIPE",
            "methodData": stripeSource
        }, cookie)

        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('STRIPE_CUSTOMER_ERROR')
        expect(response.data.error.type).toEqual('StripeCardError')
        expect(response.data.error.code).toEqual('card_declined')
        expect(response.data.error.message).toEqual('Your card has insufficient funds.')
    })

    test('POST / checkout with new Stripe (not save card) - VISA', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        stripeData['card[number]'] = '4000000000000077'
        const stripeSource = await stripe.sources.create(stripeData)

        let checkout = await request.createStripeOrder(cookie, item, stripeSource, false)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
    })

    test('POST / checkout with new Stripe (save card) - MASTER', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        stripeData['card[number]'] = '5555555555554444'
        const stripeSource = await stripe.sources.create(stripeData)

        let checkout = await request.createStripeOrder(cookie, item, stripeSource, true)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
    })

    test('POST / checkout with saved Stripe', async () => {
        let matchedCard = await request.getCard('Stripe', cookie)
        item = await request.getInStockProduct(config.api.internationalSales, 1)

        let checkout = await request.createStripeOrder(cookie, item, matchedCard)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
    })
})