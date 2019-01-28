import config from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
let cookie: string

describe('Verify auto-confirm order (skip-prod) ' + config.baseUrl + config.api.checkout, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses()
    })

    afterEach(async () => {
        await request.emptyCart()
    })

    it('Not auto-confirm order when value >= 5,000,000', async () => {
        let items = await request.getInStockProducts(config.api.currentSales, 1, 500000)
        let checkout = await request.createCodOrder(items.slice(0, 5))
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
        expect(order.status).toEqual('placed')
        expect(order.paymentSummary.total).toBeGreaterThanOrEqual(5000000)
    })

    it('Not auto-confirm order when quantity >= 2', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 3)
        let checkout = await request.createCodOrder([item, item])
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
        expect(order.status).toEqual('placed')
        expect(order.products[0].quantity).toBeGreaterThanOrEqual(2)
    })

    it('Not auto-confirm order when sum quantiy >= 5', async () => {
        let items = await request.getInStockProducts(config.api.featuredSales, 2)
        let checkout = await request.createCodOrder(items.slice(0, 5))
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
        expect(order.status).toEqual('placed')

        let sum = 0
        for (let product of order.products) {
            sum += product.quantity
        }
        expect(sum).toBeGreaterThanOrEqual(5)
    })

    it('Not auto-confirm international order', async () => {
        let item = await request.getInStockProduct(config.api.internationalSales, 2)
        let stripeData = {
            "type": "card",
            "card[cvc]": "222",
            "card[exp_month]": "02",
            "card[exp_year]": "22",
            "card[number]": "4000000000000077",
            "key": config.stripeKey
        }

        const stripeSource = await request.postFormUrl(config.stripeApi, '/v1/sources', stripeData)

        let checkout = await request.createStripeOrder([item], stripeSource.data, false)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
    })

    // it('Auto-confirm order for regular customer', async () => {

    // })
})