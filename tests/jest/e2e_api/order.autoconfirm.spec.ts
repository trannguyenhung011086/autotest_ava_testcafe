import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let cookie: string
let checkoutInput: Model.CheckoutInput
let addresses: Model.Addresses

let request = new Utils.CheckoutUtils
let requestAddress = new Utils.AddressUtils
let requestAccount = new Utils.AccountUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils
let requestOrder = new Utils.OrderUtils

export const OrdersConfirmTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
        await requestAddress.addAddresses(cookie)
        addresses = await requestAddress.getAddresses(cookie)
        checkoutInput = {}
    })

    afterEach(async () => {
        await requestCart.emptyCart(cookie)
    })

    afterAll(async () => {
        await requestAddress.deleteAddresses(cookie)
    })

    it('Not auto-confirm order when value >= 5,000,000', async () => {
        let items = await requestProduct.getInStockProducts(config.api.currentSales, 1, 1000000)
        for (let item of items.slice(0, 5)) {
            await requestCart.addToCart(item.id, cookie)
        }

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses

        let checkout = await request.checkoutCod(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
        expect(order.paymentSummary.total).toBeGreaterThanOrEqual(5000000)
    })

    it('Not auto-confirm order when quantity >= 2', async () => {
        let item = await requestProduct.getInStockProduct(config.api.currentSales, 2)
        await requestCart.addToCart(item.id, cookie)
        await requestCart.addToCart(item.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses

        let checkout = await request.checkoutCod(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
        expect(order.products[0].quantity).toBeGreaterThanOrEqual(2)
    })

    it('Not auto-confirm order when sum quantiy >= 5', async () => {
        let items = await requestProduct.getInStockProducts(config.api.currentSales, 2)
        for (let item of items.slice(0, 6)) {
            await requestCart.addToCart(item.id, cookie)
        }

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses

        let checkout = await request.checkoutCod(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')

        let sum = 0
        for (let product of order.products) {
            sum += product.quantity
        }
        expect(sum).toBeGreaterThanOrEqual(5)
    })

    it('Not auto-confirm international order', async () => {
        let item = await requestProduct.getInStockProduct(config.api.internationalSales, 2)
        await requestCart.addToCart(item.id, cookie)

        let stripeData = {
            "type": "card",
            "card[cvc]": "222",
            "card[exp_month]": "02",
            "card[exp_year]": "22",
            "card[number]": "4000000000000077",
            "key": config.stripeKey
        }

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase)

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await requestOrder.getOrderInfo(checkout.orderId, cookie)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeTrue()
    })

    // it('Auto-confirm order for regular customer', async () => {

    // })
}

describe('Verify auto-confirm order (skip-prod) ' + config.baseUrl + config.api.checkout, OrdersConfirmTest)