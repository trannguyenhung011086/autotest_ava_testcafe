import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as Model from '../../common/interface'
let account: Model.Account
let item: Model.Product
let addresses: Model.Addresses
let payDollarCreditCard: Model.PayDollarCreditCard
let cookie: string

describe('Checkout API - Logged in - PayDollar ' + config.baseUrl + config.api.checkout, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    test('POST / cannot checkout with CC - international product', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

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
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('International orders must be paid by credit card. Please refresh the page and try again.')
    })

    test('POST / checkout with new CC (not save card) - VISA', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)

        let checkout = await request.createPayDollarOrder(cookie, item, false)
        expect(checkout.orderId).not.toBeEmpty()

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

        let result = await request.postFormUrl(config.payDollarBase, config.payDollarApi, payDollarCreditCard)
        let parse = await request.parsePayDollarRes(result.data)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    test('POST / checkout with new CC (save card) - MASTER', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)
        
        let checkout = await request.createPayDollarOrder(cookie, item, true)
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

        let result = await request.postFormUrl(config.payDollarBase, config.payDollarApi, payDollarCreditCard)
        let parse = await request.parsePayDollarRes(result.data)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })

    test('POST / checkout with saved CC', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)
        let matchedCard = await request.getCard('PayDollar', cookie)
        
        let checkout = await request.createSavedPayDollarOrder(cookie, item, matchedCard)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(checkout.creditCard.orderRef).toInclude(order.code)
        expect(order.status).toEqual('pending')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('CC')
        expect(order.paymentSummary.shipping).toEqual(0)

        payDollarCreditCard = checkout.creditCard
        let result = await request.postFormUrl(config.payDollarBase, config.payDollarApi, payDollarCreditCard)
        let parse = await request.parsePayDollarRes(result.data)

        expect(parse.successcode).toEqual('0')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction completed/)

        order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
    })
})