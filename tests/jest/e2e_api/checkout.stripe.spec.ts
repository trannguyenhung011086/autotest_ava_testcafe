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
let checkoutInput: Model.CheckoutInput

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
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
        checkoutInput = {}
        jest.setTimeout(120000)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    afterAll(async () => {
        await request.deleteAddresses(cookie)
    })

    it('POST / cannot checkout with invalid Stripe', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id, cookie)

        account = await request.getAccountInfo(cookie)

        stripeData['card[number]'] = '123456789'
        const stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase).then(res => res.body)

        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "STRIPE",
            "methodData": stripeSource
        }, cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('STRIPE_CUSTOMER_ERROR')
        expect(res.body.error.type).toEqual('StripeInvalidRequestError')
        expect(res.body.error.code).toEqual('parameter_missing')
        expect(res.body.error.message).toEqual('Missing required param: source.')
    })

    it('POST / cannot checkout with unsupported Stripe', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id, cookie)

        account = await request.getAccountInfo(cookie)

        stripeData['card[number]'] = '3566002020360505' // JCB
        const stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase).then(res => res.body)

        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "STRIPE",
            "methodData": stripeSource
        }, cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('STRIPE_CUSTOMER_ERROR')
        expect(res.body.error.type).toEqual('StripeInvalidRequestError')
        expect(res.body.error.code).toEqual('parameter_missing')
        expect(res.body.error.message).toEqual('Missing required param: source.')
    })

    it('POST / checkout with new Stripe (not save card) - VISA', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id, cookie)

        stripeData['card[number]'] = '4000000000000077'

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase).then(res => res.body)

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
    })

    it('POST / checkout with new Stripe (save card) - MASTER', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id, cookie)

        stripeData['card[number]'] = '5555555555554444'

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = true
        checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase).then(res => res.body)

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
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
        await request.addToCart(item.id, cookie)

        let credit: number
        if (account.accountCredit < (item.salePrice - voucher.amount)) {
            credit = account.accountCredit
        } else if (account.accountCredit >= (item.salePrice - voucher.amount)) {
            credit = item.salePrice - voucher.amount
        }

        stripeData['card[number]'] = '5555555555554444'

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id
        checkoutInput.credit = credit
        checkoutInput.saveNewCard = true
        checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase).then(res => res.body)

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
        expect(order.paymentSummary.voucherAmount).toEqual(voucher.amount)
        expect(Math.abs(order.paymentSummary.accountCredit)).toEqual(credit)
    })

    it('POST / checkout with saved Stripe', async () => {
        let matchedCard = await request.getCard('Stripe', cookie)

        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id, cookie)

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.methodData = matchedCard

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
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

        let matchedCard = await request.getCard('Stripe', cookie)

        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id, cookie)

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id
        checkoutInput.methodData = matchedCard

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
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