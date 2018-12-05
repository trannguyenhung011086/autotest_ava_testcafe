import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as Model from '../../common/interface'
let account: Model.Account
let item: Model.Product
let cart: Model.Cart
let addresses: Model.Addresses
let payDollarCreditCard: Model.PayDollarCreditCard
let failedAttemptOrder: Model.FailedAttempt
let cookie: string

describe('Checkout API - Logged in - Failed Attempt ' + config.baseUrl + config.api.cart, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    test('POST / create failed-attempt order', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        cart = await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)
        addresses = await request.getAddresses(cookie)

        let checkout = await request.checkoutPayDollar(account, addresses, cookie)

        payDollarCreditCard = checkout.creditCard
        payDollarCreditCard.cardHolder = 'testing card'
        payDollarCreditCard.cardNo = '5422882800700006'
        payDollarCreditCard.pMethod = 'Master'
        payDollarCreditCard.epMonth = 7
        payDollarCreditCard.epYear = 2020
        payDollarCreditCard.securityCode = '123'

        let result = await request.postFormUrl(config.payDollarBase, config.payDollarApi, payDollarCreditCard)
        let parse = await request.parsePayDollarRes(result.data)

        expect(parse.successcode).toEqual('1')
        expect(parse.Ref).toEqual(checkout.creditCard.orderRef)
        expect(parse.errMsg).toMatch(/Transaction failed/)

        let failedAttempt = await request.post(config.api.checkout + '/order/failed-attempt', {
            "errorMsg": "invalid card",
            "orderCode": parse.Ref
        }, cookie)
        expect(failedAttempt.status).toEqual(200)

        let failedData: Model.FailedAttempt = failedAttempt.data
        expect(parse.Ref).toInclude(failedData.code)
        expect(item.id).toEqual(failedData.products[0].productId)
    })

    test('POST / recheckout with COD', async () => {
        failedAttemptOrder = await request.createFailedAttemptOrder(cookie)
        let response = await request.post(config.api.checkout + '/order/' + failedAttemptOrder.code, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": [
                {
                    "id": failedAttemptOrder.products[0].id,
                    "quantity": failedAttemptOrder.products[0].quantity,
                    "salePrice": failedAttemptOrder.products[0].salePrice
                }
            ],
            "method": "COD",
            "shipping": 25000,
            "accountCredit": 0
        }, cookie)

        expect(response.status).toEqual(200)
        expect(response.data.code).not.toBeEmpty()

        let order = await request.getOrderInfo(response.data.orderId, cookie)
        expect(order.code).toInclude(response.data.code)
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
    })
})