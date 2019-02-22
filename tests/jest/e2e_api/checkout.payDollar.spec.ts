import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let account: Model.Account
let item: Model.Product
let addresses: Model.Addresses
let payDollarCreditCard: Model.PayDollarCreditCard
let checkoutInput: Model.CheckoutInput
let cookie: string

let request = new Utils.CheckoutUtils
let requestAddress = new Utils.AddressUtils
let requestAccount = new Utils.AccountUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils
let requestOrder = new Utils.OrderUtils
let requestCreditcard = new Utils.CreditCardUtils
let access = new Utils.DbAccessUtils

export const CheckoutPayDollarTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
        await requestAddress.addAddresses(cookie)
        addresses = await requestAddress.getAddresses(cookie)
        account = await requestAccount.getAccountInfo(cookie)
        checkoutInput = {}
        jest.setTimeout(150000)
    })

    afterEach(async () => {
        await requestCart.emptyCart(cookie)
    })

    afterAll(async () => {
        await requestAddress.deleteAddresses(cookie)
    })

    it('POST / cannot checkout with CC - international product', async () => {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('International orders must be paid by credit card. Please refresh the page and try again.')
    })

    it.only('POST / cannot checkout with invalid CC', async () => {
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

        expect(parse.successcode).toEqual('1')
        expect(parse.errMsg).toMatch(/Transaction failed/)

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('failed')
    })

    it.each([['3566002020360505', 'JCB'], ['378282246310005', 'AMEX']])
        ('POST / cannot checkout with non-supported CC - %s %s', async (cardNumber, provider) => {
            item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
            await requestCart.addToCart(item.id, cookie)

            checkoutInput.account = await requestAccount.getAccountInfo(cookie)
            checkoutInput.addresses = addresses

            let checkout = await request.checkoutPayDollar(checkoutInput, cookie)

            payDollarCreditCard = checkout.creditCard
            payDollarCreditCard.cardHolder = 'testing card'
            payDollarCreditCard.cardNo = cardNumber
            payDollarCreditCard.pMethod = provider
            payDollarCreditCard.epMonth = 7
            payDollarCreditCard.epYear = 2020
            payDollarCreditCard.securityCode = '123'

            let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
                cookie, config.payDollarBase)
            let parse = await request.parsePayDollarRes(result.body)

            expect(parse.successcode).toEqual('-1')
            expect(parse.Ref).toBeEmpty()
            expect(parse.errMsg).toMatch(/Your account doesn\'t support the payment method \((JCB|AMEX)\)/)

            let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
            expect(order.status).toEqual('pending')
        })

    it('POST / checkout with new CC (not save card) - VISA', async () => {
        item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
        await requestCart.addToCart(item.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false

        let checkout = await request.checkoutPayDollar(checkoutInput, cookie)

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
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

        let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with new CC (not save card) - MASTER', async () => {
        item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
        await requestCart.addToCart(item.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false

        let checkout = await request.checkoutPayDollar(checkoutInput, cookie)

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
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

        let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with new CC (save card) - MASTER', async () => {
        item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
        await requestCart.addToCart(item.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = true

        let checkout = await request.checkoutPayDollar(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
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

        let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with new CC (save card) - VISA - voucher (amount) + credit', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: '433590,542288,555555,400000',
            discountType: 'amount',
            amount: { $gt: 0 },
            specificDays: []
        })

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
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
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

        let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with saved CC', async () => {
        let matchedCard = await requestCreditcard.getCard('PayDollar', cookie)

        item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
        await requestCart.addToCart(item.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.methodData = matchedCard

        let checkout = await request.checkoutPayDollar(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(checkout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)

        payDollarCreditCard = checkout.creditCard
        let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / checkout with saved CC - voucher (percentage + max discount)', async () => {
        let matchedCard = await requestCreditcard.getCard('PayDollar', cookie)

        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: '433590,542288,555555,400000',
            discountType: 'percentage',
            maximumDiscountAmount: { $gt: 0 },
            specificDays: []
        })

        item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
        await requestCart.addToCart(item.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id
        checkoutInput.methodData = matchedCard

        let checkout = await request.checkoutPayDollar(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(checkout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)
        expect(order.paymentSummary.voucherAmount).toBeLessThanOrEqual(voucher.maximumDiscountAmount)

        payDollarCreditCard = checkout.creditCard
        let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })
}

describe('Checkout API - Logged in - PayDollar (skip-prod) ' + config.baseUrl +
    config.api.checkout, CheckoutPayDollarTest)