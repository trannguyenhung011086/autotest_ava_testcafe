import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let account: Model.Account
let customer: Model.Customer
let item: Model.Product
let addresses: Model.Addresses
let payDollarCreditCard: Model.PayDollarCreditCard
let failedAttemptOrder: Model.FailedAttempt
let checkoutInput: Model.CheckoutInput = {}

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
    t.context['cookie'] = await request.getLogInCookie(config.testAccount.email_ex[7],
        config.testAccount.password_ex)

    addresses = await requestAddress.getAddresses(t.context['cookie'])
    account = await requestAccount.getAccountInfo(t.context['cookie'])
    customer = await access.getCustomerInfo({ email: account.email })

    item = await requestProduct.getProductWithCountry('VN', 0, 2000000)

    failedAttemptOrder = await request.createFailedAttemptOrder([item], t.context['cookie'])
    t.truthy(failedAttemptOrder.orderId)

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses
    checkoutInput.cart = [
        {
            "id": failedAttemptOrder.products[0].id,
            "quantity": failedAttemptOrder.products[0].quantity,
            "salePrice": failedAttemptOrder.products[0].salePrice
        }
    ]
    checkoutInput.orderCode = failedAttemptOrder.code
})

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context['cookie'])
})

test.serial('POST / recheckout with COD', async t => {
    let reCheckout = await request.checkoutCod(checkoutInput, t.context['cookie'])
    t.truthy(reCheckout.orderId)

    let order = await requestOrder.getOrderInfo(reCheckout.orderId, t.context['cookie'])

    t.true(order.code.includes(reCheckout.code))
    t.deepEqual(order.status, 'placed')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'COD')
    t.deepEqual(order.paymentSummary.shipping, 25000)
})

test.serial('POST / recheckout with new CC (not save card) - VISA', async t => {
    checkoutInput.saveNewCard = false

    let reCheckout = await request.checkoutPayDollar(checkoutInput, t.context['cookie'])
    t.truthy(reCheckout.orderId)

    let order = await requestOrder.getOrderInfo(reCheckout.orderId, t.context['cookie'])

    t.true(reCheckout.creditCard.orderRef.includes(order.code))
    t.deepEqual(order.status, 'pending')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'CC')
    t.deepEqual(order.paymentSummary.shipping, 0)

    payDollarCreditCard = reCheckout.creditCard
    payDollarCreditCard.cardHolder = 'testing card'
    payDollarCreditCard.cardNo = '4335900000140045'
    payDollarCreditCard.pMethod = 'VISA'
    payDollarCreditCard.epMonth = 7
    payDollarCreditCard.epYear = 2020
    payDollarCreditCard.securityCode = '123'

    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        t.context['cookie'], config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '0')
    t.deepEqual(parse.Ref, reCheckout.creditCard.orderRef)
    t.regex(parse.errMsg, /Transaction completed/)

    order = await requestOrder.getOrderInfo(reCheckout.orderId, t.context['cookie'])
    t.deepEqual(order.status, 'placed')
})

test.serial('POST / recheckout with new CC (save card) - MASTER', async t => {
    checkoutInput.saveNewCard = true

    let reCheckout = await request.checkoutPayDollar(checkoutInput, t.context['cookie'])
    t.truthy(reCheckout.orderId)

    let order = await requestOrder.getOrderInfo(reCheckout.orderId, t.context['cookie'])

    t.true(reCheckout.creditCard.orderRef.includes(order.code))
    t.deepEqual(order.status, 'pending')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'CC')
    t.deepEqual(order.paymentSummary.shipping, 0)

    payDollarCreditCard = reCheckout.creditCard
    payDollarCreditCard.cardHolder = 'testing card'
    payDollarCreditCard.cardNo = '5422882800700007'
    payDollarCreditCard.pMethod = 'Master'
    payDollarCreditCard.epMonth = 7
    payDollarCreditCard.epYear = 2020
    payDollarCreditCard.securityCode = '123'

    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        t.context['cookie'], config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '0')
    t.deepEqual(parse.Ref, reCheckout.creditCard.orderRef)
    t.regex(parse.errMsg, /Transaction completed/)

    order = await requestOrder.getOrderInfo(reCheckout.orderId, t.context['cookie'])
    t.deepEqual(order.status, 'placed')
})

test.serial('POST / recheckout with saved CC', async t => {
    let matchedCard = await requestCreditcard.getCard('PayDollar', t.context['cookie'])
    checkoutInput.methodData = matchedCard

    let reCheckout = await request.checkoutPayDollar(checkoutInput, t.context['cookie'])
    t.truthy(reCheckout.orderId)

    let order = await requestOrder.getOrderInfo(reCheckout.orderId, t.context['cookie'])

    t.true(reCheckout.creditCard.orderRef.includes(order.code))
    t.deepEqual(order.status, 'pending')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'CC')
    t.deepEqual(order.paymentSummary.shipping, 0)

    payDollarCreditCard = reCheckout.creditCard
    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        t.context['cookie'], config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '0')
    t.deepEqual(parse.Ref, reCheckout.creditCard.orderRef)
    t.regex(parse.errMsg, /Transaction completed/)

    order = await requestOrder.getOrderInfo(reCheckout.orderId, t.context['cookie'])
    t.deepEqual(order.status, 'placed')
})

test.serial('POST / recheckout with COD - voucher (amount) + credit', async t => {
    const voucher = await access.getNotUsedVoucher({
        expiry: { $gte: new Date() },
        used: false,
        numberOfItems: { $exists: false },
        minimumPurchase: null,
        binRange: { $exists: false },
        discountType: 'amount',
        amount: { $gt: 0 },
        specificDays: []
    }, customer)

    t.truthy(voucher)

    const credit = request.calculateCredit(account.accountCredit,
        item.salePrice, voucher.amount)

    checkoutInput.voucherId = voucher._id
    checkoutInput.credit = credit

    let reCheckout = await request.checkoutPayDollar(checkoutInput, t.context['cookie'])
    t.truthy(reCheckout.orderId)

    let order = await requestOrder.getOrderInfo(reCheckout.orderId, t.context['cookie'])

    t.true(order.code.includes(reCheckout.code))
    t.deepEqual(order.status, 'placed')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'COD')
    t.deepEqual(order.paymentSummary.shipping, 25000)
    t.deepEqual(order.paymentSummary.voucherAmount, voucher.amount)
    t.deepEqual(Math.abs(order.paymentSummary.accountCredit), credit)
})

test.serial('POST / recheckout with saved CC - voucher (percentage + max discount)', async t => {
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        used: false,
        binRange: '433590,542288,555555,400000',
        discountType: 'percentage',
        maximumDiscountAmount: { $gt: 0 },
        specificDays: []
    })

    t.truthy(voucher)

    let matchedCard = await requestCreditcard.getCard('PayDollar', t.context['cookie'])

    checkoutInput.voucherId = voucher._id
    checkoutInput.methodData = matchedCard

    let reCheckout = await request.checkoutPayDollar(checkoutInput, t.context['cookie'])
    t.truthy(reCheckout.orderId)

    let order = await requestOrder.getOrderInfo(reCheckout.orderId, t.context['cookie'])

    t.deepEqual(order.status, 'pending')
    t.false(order.isCrossBorder)
    t.deepEqual(order.paymentSummary.method, 'CC')
    t.deepEqual(order.paymentSummary.shipping, 0)
    t.true(order.paymentSummary.voucherAmount <= voucher.maximumDiscountAmount)

    payDollarCreditCard = reCheckout.creditCard
    let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
        t.context['cookie'], config.payDollarBase)
    let parse = await request.parsePayDollarRes(result.body)

    t.deepEqual(parse.successcode, '0')
    t.deepEqual(parse.Ref, reCheckout.creditCard.orderRef)
    t.regex(parse.errMsg, /Transaction completed/)

    order = await requestOrder.getOrderInfo(reCheckout.orderId, t.context['cookie'])
    t.deepEqual(order.status, 'placed')
})