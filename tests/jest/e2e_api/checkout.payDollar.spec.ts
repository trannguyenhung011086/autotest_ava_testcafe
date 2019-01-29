import config from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as Model from '../../../common/interface'
let account: Model.Account
let item: Model.Product
let addresses: Model.Addresses
let payDollarCreditCard: Model.PayDollarCreditCard
let cookie: string

export const CheckoutPayDollarTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses()
        addresses = await request.getAddresses()
        account = await request.getAccountInfo()
        jest.setTimeout(150000)
    })

    afterEach(async () => {
        await request.emptyCart()
    })

    it('POST / cannot checkout with CC - international product', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id)
        account = await request.getAccountInfo()

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "CC",
            "saveCard": true,
            "shipping": 0,
            "accountCredit": 0
        })

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('International orders must be paid by credit card. Please refresh the page and try again.')
    })

    it('POST / cannot checkout with invalid CC', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id)
        account = await request.getAccountInfo()
        addresses = await request.getAddresses()

        let checkout = await request.checkoutPayDollar(account, addresses)

        payDollarCreditCard = checkout.creditCard
        payDollarCreditCard.cardHolder = 'testing card'
        payDollarCreditCard.cardNo = '123456789'
        payDollarCreditCard.pMethod = 'VISA'
        payDollarCreditCard.epMonth = 7
        payDollarCreditCard.epYear = 2020
        payDollarCreditCard.securityCode = '123'

        let result = await request.postFormUrl(config.payDollarBase, config.payDollarApi,
            payDollarCreditCard)
        let parse = await request.parsePayDollarRes(result.data)

        expect(parse.successcode).toEqual('-1')
        expect(parse.Ref).toBeEmpty()
        expect(parse.errMsg).toMatch(/Parameter cardNo incorrect/)
    })

    it.each([['3566002020360505', 'JCB'], ['378282246310005', 'AMEX']])
        ('POST / cannot checkout with non-supported CC - %s %s', async (cardNumber, provider) => {
            item = await request.getInStockProduct(config.api.todaySales, 1)
            await request.addToCart(item.id)
            account = await request.getAccountInfo()
            addresses = await request.getAddresses()

            let checkout = await request.checkoutPayDollar(account, addresses)

            payDollarCreditCard = checkout.creditCard
            payDollarCreditCard.cardHolder = 'testing card'
            payDollarCreditCard.cardNo = cardNumber
            payDollarCreditCard.pMethod = provider
            payDollarCreditCard.epMonth = 7
            payDollarCreditCard.epYear = 2020
            payDollarCreditCard.securityCode = '123'

            let result = await request.postFormUrl(config.payDollarBase, config.payDollarApi,
                payDollarCreditCard)
            let parse = await request.parsePayDollarRes(result.data)

            expect(parse.successcode).toEqual('-1')
            expect(parse.Ref).toBeEmpty()
            expect(parse.errMsg).toMatch(/Your account doesn\'t support the payment method \((JCB|AMEX)\)/)
        })

    it('POST / checkout with new CC (not save card) - VISA', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)

        let checkout = await request.createPayDollarOrder([item], false)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
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

        let result = await request.postFormUrl(config.payDollarBase, config.payDollarApi,
            payDollarCreditCard)
        let parse = await request.parsePayDollarRes(result.data)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with new CC (save card) - MASTER', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)

        let checkout = await request.createPayDollarOrder([item], true)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
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

        let result = await request.postFormUrl(config.payDollarBase, config.payDollarApi,
            payDollarCreditCard)
        let parse = await request.parsePayDollarRes(result.data)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with saved CC', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let matchedCard = await request.getCard('PayDollar')

        let checkout = await request.createSavedPayDollarOrder([item], matchedCard)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
        expect(checkout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)

        payDollarCreditCard = checkout.creditCard
        let result = await request.postFormUrl(config.payDollarBase, config.payDollarApi,
            payDollarCreditCard)
        let parse = await request.parsePayDollarRes(result.data)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId)
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

        let checkout = await request.createPayDollarOrder([item, item], false, voucher._id, credit)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
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

        let result = await request.postFormUrl(config.payDollarBase, config.payDollarApi,
            payDollarCreditCard)
        let parse = await request.parsePayDollarRes(result.data)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with saved CC - voucher (percentage + max discount)', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: '433590,542288,555555,400000',
            discountType: 'percentage',
            maximumDiscountAmount: { $gt: 0 },
            specificDays: []
        })

        item = await request.getInStockProduct(config.api.todaySales, 1)
        let matchedCard = await request.getCard('PayDollar')

        let checkout = await request.createSavedPayDollarOrder([item], matchedCard, voucher._id)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
        expect(checkout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)
        expect(order.paymentSummary.voucherAmount).toBeLessThanOrEqual(voucher.maximumDiscountAmount)

        payDollarCreditCard = checkout.creditCard
        let result = await request.postFormUrl(config.payDollarBase, config.payDollarApi,
            payDollarCreditCard)
        let parse = await request.parsePayDollarRes(result.data)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId)
        expect(order.status).toEqual('placed')
    })
}

describe('Checkout API - Logged in - PayDollar (skip-prod) ' + config.baseUrl +
    config.api.checkout, CheckoutPayDollarTest)