import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let account: Model.Account
let item: Model.Product
let addresses: Model.Addresses
let checkoutInput: Model.CheckoutInput = {}

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

import test from 'ava'

test.before(async t => {
    t.context['cookie'] = await request.getLogInCookie(config.testAccount.email_ex[3],
        config.testAccount.password_ex)

    addresses = await requestAddress.getAddresses(t.context['cookie'])
})

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context['cookie'])
})

test.serial('POST / cannot checkout with declined Stripe', async t => {
    item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])

    account = await requestAccount.getAccountInfo(t.context['cookie'])

    stripeData['card[number]'] = '4000000000000002'
    const stripeSource = await request.postFormUrl('/v1/sources', stripeData,
        t.context['cookie'], config.stripeBase).then(res => res.body)

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "STRIPE",
        "methodData": stripeSource
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'STRIPE_CUSTOMER_ERROR')
    t.deepEqual(res.body.error.type, 'StripeCardError')
    t.deepEqual(res.body.error.code, 'card_declined')
    t.deepEqual(res.body.error.message, 'Your card was declined.')
})

test.serial('POST / cannot checkout with unsupported Stripe', async t => {
    item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])

    account = await requestAccount.getAccountInfo(t.context['cookie'])

    stripeData['card[number]'] = '3566002020360505' // JCB
    const stripeSource = await request.postFormUrl('/v1/sources', stripeData,
        t.context['cookie'], config.stripeBase).then(res => res.body)

    t.truthy(stripeSource['error']['code'], 'card_declined')

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "STRIPE",
        "methodData": stripeSource
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'STRIPE_CUSTOMER_ERROR')
    t.deepEqual(res.body.error.type, 'StripeInvalidRequestError')
    t.deepEqual(res.body.error.code, 'parameter_missing')
    t.deepEqual(res.body.error.message, 'Missing required param: source.')
})

test.serial('POST / checkout with new Stripe (not save card) - VISA', async t => {
    item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])

    stripeData['card[number]'] = '4000000000000077'

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses
    checkoutInput.saveNewCard = false
    checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
        t.context['cookie'], config.stripeBase).then(res => res.body)

    let checkout = await request.checkoutStripe(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])

    t.true(order.code.includes(checkout.code))
    t.deepEqual(order.status, 'placed')
    t.true(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'STRIPE')
    t.deepEqual(order.paymentSummary.shipping, 0)
})

test.serial('POST / checkout with new Stripe (not save card) - MASTER', async t => {
    item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])

    stripeData['card[number]'] = '5555555555554444'

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses
    checkoutInput.saveNewCard = false
    checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
        t.context['cookie'], config.stripeBase).then(res => res.body)

    let checkout = await request.checkoutStripe(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])

    t.true(order.code.includes(checkout.code))
    t.deepEqual(order.status, 'placed')
    t.true(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'STRIPE')
    t.deepEqual(order.paymentSummary.shipping, 0)
})

test.serial('POST / checkout with new Stripe (save card) - VISA', async t => {
    item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])

    stripeData['card[number]'] = '4000000000000077'

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses
    checkoutInput.saveNewCard = true
    checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
        t.context['cookie'], config.stripeBase).then(res => res.body)

    let checkout = await request.checkoutStripe(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])

    t.true(order.code.includes(checkout.code))
    t.deepEqual(order.status, 'placed')
    t.true(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'STRIPE')
    t.deepEqual(order.paymentSummary.shipping, 0)
})

test.serial('POST / checkout with saved Stripe', async t => {
    let matchedCard = await requestCreditcard.getCard('Stripe', t.context['cookie'])

    item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses
    checkoutInput.methodData = matchedCard

    let checkout = await request.checkoutStripe(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])

    t.true(order.code.includes(checkout.code))
    t.deepEqual(order.status, 'placed')
    t.true(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'STRIPE')
    t.deepEqual(order.paymentSummary.shipping, 0)
})

test.serial('POST / checkout with new Stripe (save card) - MASTER - voucher (amount) + credit', async t => {
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        used: false,
        binRange: '433590,542288,555555,400000',
        discountType: 'amount',
        amount: { $gt: 0 },
        specificDays: []
    })

    item = await requestProduct.getInStockProduct(config.api.internationalSales, 2)
    await requestCart.addToCart(item.id, t.context['cookie'])

    account = await requestAccount.getAccountInfo(t.context['cookie'])

    const credit = request.calculateCredit(account.accountCredit,
        item.salePrice, voucher.amount)

    stripeData['card[number]'] = '5555555555554444'

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses
    checkoutInput.voucherId = voucher._id
    checkoutInput.credit = credit
    checkoutInput.saveNewCard = true
    checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
        t.context['cookie'], config.stripeBase).then(res => res.body)

    let checkout = await request.checkoutStripe(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])

    t.true(order.code.includes(checkout.code))
    t.deepEqual(order.status, 'placed')
    t.true(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'STRIPE')
    t.deepEqual(order.paymentSummary.shipping, 0)
    t.deepEqual(order.paymentSummary.voucherAmount, voucher.amount)
    t.deepEqual(Math.abs(order.paymentSummary.accountCredit), credit)
})

test.serial.only('POST / checkout with saved Stripe - voucher (percentage + max discount)', async t => {
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        used: false,
        binRange: '433590,542288,555555,400000',
        discountType: 'percentage',
        maximumDiscountAmount: { $gt: 0 },
        specificDays: []
    })

    let matchedCard = await requestCreditcard.getCard('Stripe', t.context['cookie'])

    item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses
    checkoutInput.voucherId = voucher._id
    checkoutInput.methodData = matchedCard

    let checkout = await request.checkoutStripe(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])

    t.true(order.code.includes(checkout.code))
    t.deepEqual(order.status, 'placed')
    t.true(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'STRIPE')
    t.deepEqual(order.paymentSummary.shipping, 0)
    t.true(order.paymentSummary.voucherAmount <= voucher.maximumDiscountAmount)
})