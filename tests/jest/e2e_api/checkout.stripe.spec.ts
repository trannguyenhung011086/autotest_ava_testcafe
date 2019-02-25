import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let account: Model.Account
let item: Model.Product
let addresses: Model.Addresses
let cookie: string
let checkoutInput: Model.CheckoutInput

let request = new Utils.CheckoutUtils
let requestAddress = new Utils.AddressUtils
let requestAccount = new Utils.AccountUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils
let requestOrder = new Utils.OrderUtils
let requestCreditcard = new Utils.CreditCardUtils
let access = new Utils.DbAccessUtils

const stripeData = {
    "type": "card",
    "card[cvc]": "222",
    "card[exp_month]": "02",
    "card[exp_year]": "22",
    "key": config.stripeKey
}

export const CheckoutStripeTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
        await requestAddress.addAddresses(cookie)
        addresses = await requestAddress.getAddresses(cookie)
        account = await requestAccount.getAccountInfo(cookie)
        checkoutInput = {}
        jest.setTimeout(120000)
    })

    afterEach(async () => {
        await requestCart.emptyCart(cookie)
    })

    afterAll(async () => {
        await requestAddress.deleteAddresses(cookie)
    })

    it('POST / cannot checkout with declined Stripe', async () => {
        item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
        await requestCart.addToCart(item.id, cookie)

        account = await requestAccount.getAccountInfo(cookie)

        stripeData['card[number]'] = '4000000000000002'
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
        expect(res.body.error.type).toEqual('StripeCardError')
        expect(res.body.error.code).toEqual('card_declined')
        expect(res.body.error.message).toEqual('Your card was declined.')
    })

    it('POST / cannot checkout with unsupported Stripe', async () => {
        item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
        await requestCart.addToCart(item.id, cookie)

        account = await requestAccount.getAccountInfo(cookie)

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
        item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
        await requestCart.addToCart(item.id, cookie)

        stripeData['card[number]'] = '4000000000000077'

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase).then(res => res.body)

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
    })

    it('POST / checkout with new Stripe (not save card) - MASTER', async () => {
        item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
        await requestCart.addToCart(item.id, cookie)

        stripeData['card[number]'] = '5555555555554444'

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase).then(res => res.body)

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
    })

    it('POST / checkout with new Stripe (save card) - VISA', async () => {
        item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
        await requestCart.addToCart(item.id, cookie)

        stripeData['card[number]'] = '4000000000000077'

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = true
        checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase).then(res => res.body)

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
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

        item = await requestProduct.getInStockProduct(config.api.internationalSales, 2)
        await requestCart.addToCart(item.id, cookie)

        const credit = request.calculateCredit(account.accountCredit,
            item.salePrice, voucher.amount)

        stripeData['card[number]'] = '5555555555554444'

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id
        checkoutInput.credit = credit
        checkoutInput.saveNewCard = true
        checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase).then(res => res.body)

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')
        expect(order.paymentSummary.shipping).toEqual(0)
        expect(order.paymentSummary.voucherAmount).toEqual(voucher.amount)
        expect(Math.abs(order.paymentSummary.accountCredit)).toEqual(credit)
    })

    it('POST / checkout with saved Stripe', async () => {
        let matchedCard = await requestCreditcard.getCard('Stripe', cookie)

        item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
        await requestCart.addToCart(item.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.methodData = matchedCard

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
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

        let matchedCard = await requestCreditcard.getCard('Stripe', cookie)

        item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
        await requestCart.addToCart(item.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id
        checkoutInput.methodData = matchedCard

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
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