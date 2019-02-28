import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let account: Model.Account
let item: Model.Product
let addresses: Model.Addresses
let payDollarCreditCard: Model.PayDollarCreditCard
let checkoutInput: Model.CheckoutInput = {}
let cookie: string

let request = new Utils.CheckoutUtils
let requestAddress = new Utils.AddressUtils
let requestAccount = new Utils.AccountUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils
let requestOrder = new Utils.OrderUtils
let requestCreditcard = new Utils.CreditCardUtils
let access = new Utils.DbAccessUtils

import test from 'ava'

test.before(async t => {
    cookie = await request.getLogInCookie(config.testAccount.email_in,
        config.testAccount.password_in)

    await requestAddress.addAddresses(cookie)
    addresses = await requestAddress.getAddresses(cookie)

    account = await requestAccount.getAccountInfo(cookie)
})

test.beforeEach(async t => {
    await requestCart.emptyCart(cookie)
})

test.after.always(async t => {
    await requestAddress.deleteAddresses(cookie)
})

test.serial('POST / cannot checkout with CC - international product', async t => {
    item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)

    await requestCart.addToCart(item.id, cookie)
    account = await requestAccount.getAccountInfo(cookie)

    let res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "CC",
        "saveCard": true,
        "shipping": 0,
        "accountCredit": 0
    }, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'International orders must be paid by credit card. Please refresh the page and try again.')
})

test.serial('POST / cannot checkout with invalid CC', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, cookie)

    checkoutInput.account = await requestAccount.getAccountInfo(cookie)
    checkoutInput.addresses = addresses

    let checkout = await request.checkoutPayDollar(checkoutInput, cookie)

    payDollarCreditCard = checkout.creditCard
    payDollarCreditCard.cardHolder = 'test'
    payDollarCreditCard.cardNo = '4111111111111111'
    payDollarCreditCard.pMethod = 'VISA'
    payDollarCreditCard.epMonth = 7
    payDollarCreditCard.epYear = 2020
    payDollarCreditCard.securityCode = '123'

    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        cookie, config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '1')
    t.regex(parse.errMsg, /Transaction failed/)

    let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
    t.deepEqual(order.status, 'failed')
})

test.serial('POST / cannot checkout with non-supported CC - JCB', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, cookie)

    checkoutInput.account = await requestAccount.getAccountInfo(cookie)
    checkoutInput.addresses = addresses

    let checkout = await request.checkoutPayDollar(checkoutInput, cookie)

    payDollarCreditCard = checkout.creditCard
    payDollarCreditCard.cardHolder = 'testing card'
    payDollarCreditCard.cardNo = '3566002020360505'
    payDollarCreditCard.pMethod = 'JCB'
    payDollarCreditCard.epMonth = 7
    payDollarCreditCard.epYear = 2020
    payDollarCreditCard.securityCode = '123'

    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        cookie, config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '-1')
    t.falsy(parse.Ref)
    t.regex(parse.errMsg, /Your account doesn\'t support the payment method \(JCB\)/)

    let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
    t.deepEqual(order.status, 'pending')
})

test.serial('POST / cannot checkout with non-supported CC - AMEX', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, cookie)

    checkoutInput.account = await requestAccount.getAccountInfo(cookie)
    checkoutInput.addresses = addresses

    let checkout = await request.checkoutPayDollar(checkoutInput, cookie)

    payDollarCreditCard = checkout.creditCard
    payDollarCreditCard.cardHolder = 'testing card'
    payDollarCreditCard.cardNo = '378282246310005'
    payDollarCreditCard.pMethod = 'AMEX'
    payDollarCreditCard.epMonth = 7
    payDollarCreditCard.epYear = 2020
    payDollarCreditCard.securityCode = '123'

    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        cookie, config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '-1')
    t.falsy(parse.Ref)
    t.regex(parse.errMsg, /Your account doesn\'t support the payment method \(AMEX\)/)

    let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
    t.deepEqual(order.status, 'pending')
})

test.serial('POST / checkout with new CC (not save card) - VISA', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, cookie)

    checkoutInput.account = await requestAccount.getAccountInfo(cookie)
    checkoutInput.addresses = addresses
    checkoutInput.saveNewCard = false

    let checkout = await request.checkoutPayDollar(checkoutInput, cookie)

    let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)

    t.true(checkout.creditCard.orderRef.includes(order.code))
    t.deepEqual(order.status, 'pending')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'CC')
    t.deepEqual(order.paymentSummary.shipping, 0)

    payDollarCreditCard = checkout.creditCard
    payDollarCreditCard.cardHolder = 'testing card'
    payDollarCreditCard.cardNo = '4335900000140045'
    payDollarCreditCard.pMethod = 'VISA'
    payDollarCreditCard.epMonth = 7
    payDollarCreditCard.epYear = 2020
    payDollarCreditCard.securityCode = '123'

    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        cookie, config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '0')
    t.deepEqual(parse.Ref, checkout.creditCard.orderRef)
    t.regex(parse.errMsg, /Transaction completed/)

    order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
    t.deepEqual(order.status, 'placed')
})

test.serial('POST / checkout with new CC (not save card) - MASTER', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, cookie)

    checkoutInput.account = await requestAccount.getAccountInfo(cookie)
    checkoutInput.addresses = addresses
    checkoutInput.saveNewCard = false

    let checkout = await request.checkoutPayDollar(checkoutInput, cookie)

    let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)

    t.true(checkout.creditCard.orderRef.includes(order.code))
    t.deepEqual(order.status, 'pending')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'CC')
    t.deepEqual(order.paymentSummary.shipping, 0)

    payDollarCreditCard = checkout.creditCard
    payDollarCreditCard.cardHolder = 'testing card'
    payDollarCreditCard.cardNo = '5422882800700007'
    payDollarCreditCard.pMethod = 'Master'
    payDollarCreditCard.epMonth = 7
    payDollarCreditCard.epYear = 2020
    payDollarCreditCard.securityCode = '123'

    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        cookie, config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '0')
    t.deepEqual(parse.Ref, checkout.creditCard.orderRef)
    t.regex(parse.errMsg, /Transaction completed/)

    order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
    t.deepEqual(order.status, 'placed')
})

test.serial('POST / checkout with new CC (save card) - MASTER', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, cookie)

    checkoutInput.account = await requestAccount.getAccountInfo(cookie)
    checkoutInput.addresses = addresses
    checkoutInput.saveNewCard = true

    let checkout = await request.checkoutPayDollar(checkoutInput, cookie)
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)

    t.true(checkout.creditCard.orderRef.includes(order.code))
    t.deepEqual(order.status, 'pending')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'CC')
    t.deepEqual(order.paymentSummary.shipping, 0)

    payDollarCreditCard = checkout.creditCard
    payDollarCreditCard.cardHolder = 'testing card'
    payDollarCreditCard.cardNo = '5422882800700007'
    payDollarCreditCard.pMethod = 'Master'
    payDollarCreditCard.epMonth = 7
    payDollarCreditCard.epYear = 2020
    payDollarCreditCard.securityCode = '123'

    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        cookie, config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '0')
    t.deepEqual(parse.Ref, checkout.creditCard.orderRef)
    t.regex(parse.errMsg, /Transaction completed/)

    order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
    t.deepEqual(order.status, 'placed')
})

test.serial('POST / checkout with saved CC', async t => {
    let matchedCard = await requestCreditcard.getCard('PayDollar', cookie)

    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, cookie)

    checkoutInput.account = await requestAccount.getAccountInfo(cookie)
    checkoutInput.addresses = addresses
    checkoutInput.methodData = matchedCard

    let checkout = await request.checkoutPayDollar(checkoutInput, cookie)
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)

    t.true(checkout.creditCard.orderRef.includes(order.code))
    t.deepEqual(order.status, 'pending')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'CC')
    t.deepEqual(order.paymentSummary.shipping, 0)

    payDollarCreditCard = checkout.creditCard
    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        cookie, config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '0')
    t.deepEqual(parse.Ref, checkout.creditCard.orderRef)
    t.regex(parse.errMsg, /Transaction completed/)

    order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
    t.deepEqual(order.status, 'placed')
})

test.serial('POST / checkout with new CC (save card) - VISA - voucher (amount) + credit', async t => {
    let voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        used: false,
        binRange: '433590,542288,555555,400000',
        discountType: 'amount',
        amount: { $gt: 0 },
        specificDays: []
    })

    t.truthy(voucher)

    item = await requestProduct.getInStockProduct(config.api.todaySales, 2)

    const credit = request.calculateCredit(account.accountCredit,
        item.salePrice, voucher.amount)

    await requestCart.addToCart(item.id, cookie)

    checkoutInput.account = await requestAccount.getAccountInfo(cookie)
    checkoutInput.addresses = addresses
    checkoutInput.voucherId = voucher._id
    checkoutInput.credit = credit
    checkoutInput.saveNewCard = true

    let checkout = await request.checkoutPayDollar(checkoutInput, cookie)
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)

    t.true(checkout.creditCard.orderRef.includes(order.code))
    t.deepEqual(order.status, 'pending')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'CC')
    t.deepEqual(order.paymentSummary.shipping, 0)
    t.deepEqual(order.paymentSummary.voucherAmount, voucher.amount)
    t.deepEqual(Math.abs(order.paymentSummary.accountCredit), credit)

    payDollarCreditCard = checkout.creditCard
    payDollarCreditCard.cardHolder = 'testing card'
    payDollarCreditCard.cardNo = '4335900000140045'
    payDollarCreditCard.pMethod = 'VISA'
    payDollarCreditCard.epMonth = 7
    payDollarCreditCard.epYear = 2020
    payDollarCreditCard.securityCode = '123'

    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        cookie, config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '0')
    t.deepEqual(parse.Ref, checkout.creditCard.orderRef)
    t.regex(parse.errMsg, /Transaction completed/)

    order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
    t.deepEqual(order.status, 'placed')
})

test.serial('POST / checkout with saved CC - voucher (percentage + max discount)', async t => {
    let matchedCard = await requestCreditcard.getCard('PayDollar', cookie)

    let voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        used: false,
        binRange: '433590,542288,555555,400000',
        discountType: 'percentage',
        maximumDiscountAmount: { $gt: 0 },
        specificDays: []
    })

    t.truthy(voucher)

    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, cookie)

    checkoutInput.account = await requestAccount.getAccountInfo(cookie)
    checkoutInput.addresses = addresses
    checkoutInput.voucherId = voucher._id
    checkoutInput.methodData = matchedCard

    let checkout = await request.checkoutPayDollar(checkoutInput, cookie)
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)

    t.true(checkout.creditCard.orderRef.includes(order.code))
    t.deepEqual(order.status, 'pending')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'CC')
    t.deepEqual(order.paymentSummary.shipping, 0)
    t.true(order.paymentSummary.voucherAmount <= voucher.maximumDiscountAmount)

    payDollarCreditCard = checkout.creditCard
    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        cookie, config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '0')
    t.deepEqual(parse.Ref, checkout.creditCard.orderRef)
    t.regex(parse.errMsg, /Transaction completed/)

    order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
    t.deepEqual(order.status, 'placed')
})