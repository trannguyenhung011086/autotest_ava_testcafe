import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as Model from '../../../common/interface'
let account: Model.Account
let customer: Model.Customer
let item: Model.Product
let addresses: Model.Addresses
let payDollarCreditCard: Model.PayDollarCreditCard
let failedAttemptOrder: Model.FailedAttempt
let cookie: string

export const ReCheckoutSuccessTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
        customer = await access.getCustomerInfo({ email: account.email })
        jest.setTimeout(120000)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    afterAll(async () => {
        await request.deleteAddresses(cookie)
    })

    it('POST / create failed-attempt order', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)

        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)
        addresses = await request.getAddresses(cookie)

        let checkout = await request.checkoutPayDollar(account, addresses,
            null, null, null, cookie)

        payDollarCreditCard = checkout.creditCard
        payDollarCreditCard.cardHolder = 'testing card'
        payDollarCreditCard.cardNo = '5422882800700006'
        payDollarCreditCard.pMethod = 'Master'
        payDollarCreditCard.epMonth = 7
        payDollarCreditCard.epYear = 2020
        payDollarCreditCard.securityCode = '123'

        let result = await request.postFormUrl(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('1')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction failed/)

        let failedAttempt = await request.post(config.api.checkout + '/order/failed-attempt', {
            "errorMsg": "invalid card",
            "orderCode": parse.Ref
        }, cookie)
        expect(failedAttempt.statusCode).toEqual(200)

        let failedData: Model.FailedAttempt = failedAttempt.body
        expect(parse.Ref).toInclude(failedData.code)
        expect(item.id).toEqual(failedData.products[0].productId)
    })

    it('POST / recheckout with COD', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)

        failedAttemptOrder = await request.createFailedAttemptOrder([item], cookie)
        let reCheckout = await request.reCheckoutCod(failedAttemptOrder, addresses,
            null, null, cookie)

        let order = await request.getOrderInfo(reCheckout.orderId, cookie)
        expect(order.code).toInclude(reCheckout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
    })

    it('POST / recheckout with new CC (not save card) - VISA', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)

        failedAttemptOrder = await request.createFailedAttemptOrder([item], cookie)
        let reCheckout = await request.reCheckoutPayDollar(failedAttemptOrder, addresses,
            false, null, null, cookie)

        let order = await request.getOrderInfo(reCheckout.orderId, cookie)
        expect(reCheckout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)

        payDollarCreditCard = reCheckout.creditCard
        payDollarCreditCard.cardHolder = 'testing card'
        payDollarCreditCard.cardNo = '4335900000140045'
        payDollarCreditCard.pMethod = 'VISA'
        payDollarCreditCard.epMonth = 7
        payDollarCreditCard.epYear = 2020
        payDollarCreditCard.securityCode = '123'

        let result = await request.postFormUrl(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(reCheckout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(reCheckout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / recheckout with new CC (save card) - MASTER', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)

        failedAttemptOrder = await request.createFailedAttemptOrder([item], cookie)
        let reCheckout = await request.reCheckoutPayDollar(failedAttemptOrder, addresses,
            true, null, null, cookie)

        let order = await request.getOrderInfo(reCheckout.orderId, cookie)
        expect(reCheckout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)

        payDollarCreditCard = reCheckout.creditCard
        payDollarCreditCard.cardHolder = 'testing card'
        payDollarCreditCard.cardNo = '5422882800700007'
        payDollarCreditCard.pMethod = 'Master'
        payDollarCreditCard.epMonth = 7
        payDollarCreditCard.epYear = 2020
        payDollarCreditCard.securityCode = '123'

        let result = await request.postFormUrl(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(reCheckout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(reCheckout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / recheckout with saved CC', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)

        let matchedCard = await request.getCard('PayDollar')

        failedAttemptOrder = await request.createFailedAttemptOrder([item], cookie)
        let reCheckout = await request.reCheckoutSavedPayDollar(failedAttemptOrder, addresses,
            matchedCard, null, null, cookie)

        let order = await request.getOrderInfo(reCheckout.orderId, cookie)
        expect(reCheckout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)

        payDollarCreditCard = reCheckout.creditCard
        let result = await request.postFormUrl(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(reCheckout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(reCheckout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / recheckout with COD - voucher (amount) + credit', async () => {
        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $exists: false },
            minimumPurchase: null,
            binRange: { $exists: false },
            discountType: 'amount',
            amount: { $gt: 0 },
            specificDays: []
        }, customer)

        item = await request.getInStockProduct(config.api.todaySales, 1)

        let credit: number
        if (account.accountCredit < (item.salePrice + 25000 - voucher.amount)) {
            credit = account.accountCredit
        } else if (account.accountCredit >= (item.salePrice + 25000 - voucher.amount)) {
            credit = item.salePrice + 25000 - voucher.amount
        }

        failedAttemptOrder = await request.createFailedAttemptOrder([item], cookie)
        let reCheckout = await request.reCheckoutCod(failedAttemptOrder, addresses,
            voucher._id, credit, cookie)

        let order = await request.getOrderInfo(reCheckout.orderId, cookie)
        expect(order.code).toInclude(reCheckout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
        expect(order.paymentSummary.voucherAmount).toEqual(voucher.amount)
        expect(Math.abs(order.paymentSummary.accountCredit)).toEqual(credit)
    })

    it('POST / recheckout with saved CC - voucher (percentage + max discount)', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: '433590,542288,555555,400000',
            discountType: 'percentage',
            maximumDiscountAmount: { $gt: 0 },
            specificDays: []
        })

        item = await request.getInStockProduct(config.api.currentSales, 1, 500000)
        let matchedCard = await request.getCard('PayDollar')

        failedAttemptOrder = await request.createFailedAttemptOrder([item], cookie)
        let reCheckout = await request.reCheckoutSavedPayDollar(failedAttemptOrder, addresses,
            matchedCard, voucher._id, null, cookie)

        let order = await request.getOrderInfo(reCheckout.orderId, cookie)
        expect(reCheckout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)
        expect(order.paymentSummary.voucherAmount).toBeLessThanOrEqual(voucher.maximumDiscountAmount)

        payDollarCreditCard = reCheckout.creditCard
        let result = await request.postFormUrl(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(reCheckout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(reCheckout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })
}

describe('Checkout API - Logged in - Failed Attempt (skip-prod) ' + config.baseUrl +
    config.api.checkout, ReCheckoutSuccessTest)