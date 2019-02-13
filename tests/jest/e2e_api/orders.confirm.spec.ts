import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
let cookie: string
import * as Model from '../../../common/interface'
let checkoutInput: Model.CheckoutInput
let addresses: Model.Addresses

export const OrdersConfirmTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        checkoutInput = {}
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    afterAll(async () => {
        await request.deleteAddresses(cookie)
    })

    it('Not auto-confirm order when value >= 5,000,000', async () => {
        let items = await request.getInStockProducts(config.api.currentSales, 1, 1000000)
        for (let item of items.slice(0, 5)) {
            await request.addToCart(item.id, cookie)
        }

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses

        let checkout = await request.checkoutCod(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
        expect(order.paymentSummary.total).toBeGreaterThanOrEqual(5000000)
    })

    it('Not auto-confirm order when quantity >= 2', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 2)
        await request.addToCart(item.id, cookie)
        await request.addToCart(item.id, cookie)

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses

        let checkout = await request.checkoutCod(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
        expect(order.products[0].quantity).toBeGreaterThanOrEqual(2)
    })

    it('Not auto-confirm order when sum quantiy >= 5', async () => {
        let items = await request.getInStockProducts(config.api.currentSales, 2)
        for (let item of items.slice(0, 6)) {
            await request.addToCart(item.id, cookie)
        }

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses

        let checkout = await request.checkoutCod(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')

        let sum = 0
        for (let product of order.products) {
            sum += product.quantity
        }
        expect(sum).toBeGreaterThanOrEqual(5)
    })

    it('Not auto-confirm international order', async () => {
        let item = await request.getInStockProduct(config.api.internationalSales, 2)
        await request.addToCart(item.id, cookie)

        let stripeData = {
            "type": "card",
            "card[cvc]": "222",
            "card[exp_month]": "02",
            "card[exp_year]": "22",
            "card[number]": "4000000000000077",
            "key": config.stripeKey
        }

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase)

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
    })

    // it('Auto-confirm order for regular customer', async () => {

    // })
}

describe('Verify auto-confirm order (skip-prod) ' + config.baseUrl + config.api.checkout, OrdersConfirmTest)