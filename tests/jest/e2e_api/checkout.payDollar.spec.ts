import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as Model from '../../../common/interface'
import { read } from 'fs';
let account: Model.Account
let item: Model.Product
let addresses: Model.Addresses
let payDollarCreditCard: Model.PayDollarCreditCard
let checkoutInput: Model.CheckoutInput
let cookie: string

export const CheckoutPayDollarTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
        checkoutInput = {}
        jest.setTimeout(150000)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    afterAll(async () => {
        await request.deleteAddresses(cookie)
    })

    it('POST / cannot checkout with CC - international product', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)

        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('International orders must be paid by credit card. Please refresh the page and try again.')
    })

    it('POST / cannot checkout with invalid CC', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses

        let checkout = await request.checkoutPayDollar(checkoutInput, cookie)

        payDollarCreditCard = checkout.creditCard
        payDollarCreditCard.cardHolder = 'testing card'
        payDollarCreditCard.cardNo = '123456789'
        payDollarCreditCard.pMethod = 'VISA'
        payDollarCreditCard.epMonth = 7
        payDollarCreditCard.epYear = 2020
        payDollarCreditCard.securityCode = '123'

        let result = await request.postFormUrl(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('-1')
        expect(parse.Ref).toBeEmpty()
        expect(parse.errMsg).toMatch(/Parameter cardNo incorrect/)
    })

    it.each([['3566002020360505', 'JCB'], ['378282246310005', 'AMEX']])
        ('POST / cannot checkout with non-supported CC - %s %s', async (cardNumber, provider) => {
            item = await request.getInStockProduct(config.api.todaySales, 1)
            await request.addToCart(item.id, cookie)

            checkoutInput.account = await request.getAccountInfo(cookie)
            checkoutInput.addresses = addresses

            let checkout = await request.checkoutPayDollar(checkoutInput, cookie)

            payDollarCreditCard = checkout.creditCard
            payDollarCreditCard.cardHolder = 'testing card'
            payDollarCreditCard.cardNo = cardNumber
            payDollarCreditCard.pMethod = provider
            payDollarCreditCard.epMonth = 7
            payDollarCreditCard.epYear = 2020
            payDollarCreditCard.securityCode = '123'

            let result = await request.postFormUrl(config.payDollarApi, payDollarCreditCard,
                cookie, config.payDollarBase)
            let parse = await request.parsePayDollarRes(result.body)

            expect(parse.successcode).toEqual('-1')
            expect(parse.Ref).toBeEmpty()
            expect(parse.errMsg).toMatch(/Your account doesn\'t support the payment method \((JCB|AMEX)\)/)
        })

    it('POST / checkout with new CC (not save card) - VISA', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false

        let checkout = await request.checkoutPayDollar(checkoutInput, cookie)

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(checkout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)

        payDollarCreditCard = checkout.creditCard
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
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with new CC (save card) - MASTER', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = true

        let checkout = await request.checkoutPayDollar(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(checkout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)

        payDollarCreditCard = checkout.creditCard
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
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with saved CC', async () => {
        let matchedCard = await request.getCard('PayDollar')

        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.methodData = matchedCard

        let checkout = await request.checkoutPayDollar(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(checkout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)

        payDollarCreditCard = checkout.creditCard
        let result = await request.postFormUrl(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with new CC (not save card) - VISA - voucher (amount) + credit', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: '433590,542288,555555,400000',
            discountType: 'amount',
            amount: { $gt: 0 },
            specificDays: []
        })

        item = await request.getInStockProduct(config.api.todaySales, 2)

        let credit: number
        if (account.accountCredit < (item.salePrice - voucher.amount)) {
            credit = account.accountCredit
        } else if (account.accountCredit >= (item.salePrice - voucher.amount)) {
            credit = item.salePrice - voucher.amount
        }

        await request.addToCart(item.id, cookie)

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id
        checkoutInput.credit = credit
        checkoutInput.saveNewCard = false

        let checkout = await request.checkoutPayDollar(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(checkout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)
        expect(order.paymentSummary.voucherAmount).toEqual(voucher.amount)
        expect(Math.abs(order.paymentSummary.accountCredit)).toEqual(credit)

        payDollarCreditCard = checkout.creditCard
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
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with saved CC - voucher (percentage + max discount)', async () => {
        let matchedCard = await request.getCard('PayDollar')

        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: '433590,542288,555555,400000',
            discountType: 'percentage',
            maximumDiscountAmount: { $gt: 0 },
            specificDays: []
        })

        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id
        checkoutInput.methodData = matchedCard

        let checkout = await request.checkoutPayDollar(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(checkout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)
        expect(order.paymentSummary.voucherAmount).toBeLessThanOrEqual(voucher.maximumDiscountAmount)

        payDollarCreditCard = checkout.creditCard
        let result = await request.postFormUrl(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })
}

describe('Checkout API - Logged in - PayDollar (skip-prod) ' + config.baseUrl +
    config.api.checkout, CheckoutPayDollarTest)