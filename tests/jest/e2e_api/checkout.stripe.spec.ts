import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as Model from '../../../common/interface'
let account: Model.Account
let item: Model.Product
let addresses: Model.Addresses
let cookie: string

const stripeData = {
    "type": "card",
    "card[cvc]": "222",
    "card[exp_month]": "02",
    "card[exp_year]": "22",
    "key": config.stripeKey
}

export const CheckoutStripeTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses()
        addresses = await request.getAddresses()
        account = await request.getAccountInfo()
    })

    afterEach(async () => {
        await request.emptyCart()
    })

    it('POST / cannot checkout with invalid Stripe', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id)
        account = await request.getAccountInfo()

        stripeData['card[number]'] = '123456789'
        const stripeSource = await request.postFormUrl(config.stripeApi, '/v1/sources', stripeData)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "STRIPE",
            "methodData": stripeSource.data
        })

        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('STRIPE_CUSTOMER_ERROR')
        expect(response.data.error.type).toEqual('StripeInvalidRequestError')
        expect(response.data.error.code).toEqual('parameter_missing')
        expect(response.data.error.message).toEqual('Missing required param: source.')
    })

    it('POST / cannot checkout with insufficient fund Stripe', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id)
        account = await request.getAccountInfo()

        stripeData['card[number]'] = '4000000000009995'
        const stripeSource = await request.postFormUrl(config.stripeApi, '/v1/sources', stripeData)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "STRIPE",
            "methodData": stripeSource.data
        })

        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('STRIPE_CUSTOMER_ERROR')
        expect(response.data.error.type).toEqual('StripeCardError')
        expect(response.data.error.code).toEqual('card_declined')
        expect(response.data.error.message).toEqual('Your card has insufficient funds.')
    })

    it('POST / cannot checkout with unsupported Stripe', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id)
        account = await request.getAccountInfo()

        stripeData['card[number]'] = '3566002020360505'
        const stripeSource = await request.postFormUrl(config.stripeApi, '/v1/sources', stripeData)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "STRIPE",
            "methodData": stripeSource.data
        })

        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('STRIPE_CUSTOMER_ERROR')
        expect(response.data.error.type).toEqual('StripeInvalidRequestError')
        expect(response.data.error.code).toEqual('parameter_missing')
        expect(response.data.error.message).toEqual('Missing required param: source.')
    })

    it('POST / checkout with new Stripe (not save card) - VISA', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        stripeData['card[number]'] = '4000000000000077'
        const stripeSource = await request.postFormUrl(config.stripeApi, '/v1/sources', stripeData)

        let checkout = await request.createStripeOrder([item], stripeSource.data, false)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
    })

    it('POST / checkout with new Stripe (save card) - MASTER', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        stripeData['card[number]'] = '5555555555554444'
        const stripeSource = await request.postFormUrl(config.stripeApi, '/v1/sources', stripeData)

        let checkout = await request.createStripeOrder([item], stripeSource.data, true)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
    })

    it('POST / checkout with saved Stripe', async () => {
        let matchedCard = await request.getCard('Stripe')
        item = await request.getInStockProduct(config.api.internationalSales, 1)

        let checkout = await request.createStripeOrder([item], matchedCard)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
    })

    it('POST / checkout with new Stripe (save card) - MASTER - voucher (amount) + credit', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: '433590,542288,555555,400000',
            discountType: 'amount',
            amount: { $gt: 0 },
            specificDays: []
        })

        item = await request.getInStockProduct(config.api.internationalSales, 2)

        let credit: number
        if (account.accountCredit < (item.salePrice - voucher.amount)) {
            credit = account.accountCredit
        } else if (account.accountCredit >= (item.salePrice - voucher.amount)) {
            credit = item.salePrice - voucher.amount
        }

        stripeData['card[number]'] = '5555555555554444'
        const stripeSource = await request.postFormUrl(config.stripeApi, '/v1/sources', stripeData)

        let checkout = await request.createStripeOrder([item, item], stripeSource.data, true,
            voucher._id, credit)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
        expect(order.paymentSummary.voucherAmount).toEqual(voucher.amount)
        expect(Math.abs(order.paymentSummary.accountCredit)).toEqual(credit)
    })

    it('POST / checkout with saved Stripe - voucher (percentage + max discount)', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: '433590,542288,555555,400000',
            discountType: 'percentage',
            maximumDiscountAmount: { $gt: 0 },
            specificDays: []
        })

        let matchedCard = await request.getCard('Stripe')
        item = await request.getInStockProduct(config.api.internationalSales, 1)

        let checkout = await request.createSavedStripeOrder([item], matchedCard, voucher._id)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
        expect(order.paymentSummary.voucherAmount).toBeLessThanOrEqual(voucher.maximumDiscountAmount)
    })
}

describe('Checkout API - Logged in - Stripe (skip-prod) ' + config.baseUrl +
    config.api.checkout, CheckoutStripeTest)