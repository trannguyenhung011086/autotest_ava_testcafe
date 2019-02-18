import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let account: Model.Account
let customer: Model.Customer
let item: Model.Product
let addresses: Model.Addresses
let payDollarCreditCard: Model.PayDollarCreditCard
let failedAttemptOrder: Model.FailedAttempt
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

export const ReCheckoutSuccessTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
        await requestAddress.addAddresses(cookie)
        addresses = await requestAddress.getAddresses(cookie)

        account = await requestAccount.getAccountInfo(cookie)
        customer = await access.getCustomerInfo({ email: account.email })

        item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
        failedAttemptOrder = await request.createFailedAttemptOrder([item], cookie)

        checkoutInput = {}
        checkoutInput.addresses = addresses
        checkoutInput.cart = [
            {
                id: failedAttemptOrder.products[0].id,
                quantity: failedAttemptOrder.products[0].quantity,
                salePrice: failedAttemptOrder.products[0].salePrice,
            }
        ]

        jest.setTimeout(150000)
    })

    afterEach(async () => {
        await requestCart.emptyCart(cookie)
    })

    afterAll(async () => {
        await requestAddress.deleteAddresses(cookie)
    })

    it('POST / recheckout with COD', async () => {
        let reCheckout = await request.checkoutCod(checkoutInput, cookie)

        let order = await requestOrder.getOrderInfo(reCheckout.orderId, cookie)
        expect(order.code).toInclude(reCheckout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
    })

    it('POST / recheckout with new CC (not save card) - VISA', async () => {
        checkoutInput.saveNewCard = false

        let reCheckout = await request.checkoutPayDollar(checkoutInput, cookie)

        let order = await requestOrder.getOrderInfo(reCheckout.orderId, cookie)
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

        let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(reCheckout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await requestOrder.getOrderInfo(reCheckout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / recheckout with new CC (save card) - MASTER', async () => {
        checkoutInput.saveNewCard = true

        let reCheckout = await request.checkoutPayDollar(checkoutInput, cookie)

        let order = await requestOrder.getOrderInfo(reCheckout.orderId, cookie)
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

        let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(reCheckout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await requestOrder.getOrderInfo(reCheckout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    it('POST / recheckout with saved CC', async () => {
        let matchedCard = await requestCreditcard.getCard('PayDollar')
        checkoutInput.methodData = matchedCard

        let reCheckout = await request.checkoutPayDollar(checkoutInput, cookie)

        let order = await requestOrder.getOrderInfo(reCheckout.orderId, cookie)
        expect(reCheckout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)

        payDollarCreditCard = reCheckout.creditCard
        let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(reCheckout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await requestOrder.getOrderInfo(reCheckout.orderId, cookie)
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

        const credit = request.calculateCredit(account.accountCredit,
            item.salePrice, voucher.amount)

        checkoutInput.voucherId = voucher._id
        checkoutInput.credit = credit

        let reCheckout = await request.checkoutPayDollar(checkoutInput, cookie)

        let order = await requestOrder.getOrderInfo(reCheckout.orderId, cookie)
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

        let matchedCard = await requestCreditcard.getCard('PayDollar')

        checkoutInput.voucherId = voucher._id
        checkoutInput.methodData = matchedCard

        let reCheckout = await request.checkoutPayDollar(checkoutInput, cookie)

        let order = await requestOrder.getOrderInfo(reCheckout.orderId, cookie)
        expect(reCheckout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)
        expect(order.paymentSummary.voucherAmount).toBeLessThanOrEqual(voucher.maximumDiscountAmount)

        payDollarCreditCard = reCheckout.creditCard
        let result = await request.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)
        let parse = await request.parsePayDollarRes(result.body)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(reCheckout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await requestOrder.getOrderInfo(reCheckout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })
}

describe('Checkout API - Logged in - Failed Attempt (skip-prod) ' + config.baseUrl +
    config.api.checkout, ReCheckoutSuccessTest)