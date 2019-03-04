import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let checkoutInput: Model.CheckoutInput = {}
let addresses: Model.Addresses

let request = new Utils.CheckoutUtils
let requestAddress = new Utils.AddressUtils
let requestAccount = new Utils.AccountUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils
let requestOrder = new Utils.OrderUtils
let access = new Utils.DbAccessUtils

import test from 'ava'

test.before(async t => {
    t.context['cookie'] = await request.getLogInCookie(config.testAccount.email_in,
        config.testAccount.password_in)

    addresses = await requestAddress.getAddresses(t.context['cookie'])
})

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context['cookie'])
})

test.serial('Not auto-confirm order when value >= 5,000,000', async t => {
    let items = await requestProduct.getInStockProducts(config.api.currentSales, 1, 1000000)

    t.true(items.length >= 5)

    for (let item of items.slice(0, 5)) {
        await requestCart.addToCart(item.id, t.context['cookie'], true)
    }

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses

    let checkout = await request.checkoutCod(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])
    t.deepEqual(order.status, 'placed')
    t.true(order.paymentSummary.total >= 5000000)
})

test.serial('Not auto-confirm order when quantity >= 2', async t => {
    let item = await requestProduct.getInStockProduct(config.api.currentSales, 2)
    await requestCart.addToCart(item.id, t.context['cookie'])
    await requestCart.addToCart(item.id, t.context['cookie'])

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses

    let checkout = await request.checkoutCod(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])
    t.deepEqual(order.status, 'placed')
    t.true(order.products[0].quantity >= 2)
})

test.serial('Not auto-confirm order when sum quantiy >= 5', async t => {
    let items = await requestProduct.getInStockProducts(config.api.currentSales, 2)
    for (let item of items.slice(0, 6)) {
        await requestCart.addToCart(item.id, t.context['cookie'])
    }

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses

    let checkout = await request.checkoutCod(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])
    t.deepEqual(order.status, 'placed')

    let sum = 0
    for (let product of order.products) {
        sum += product.quantity
    }
    t.true(sum >= 5)
})

test.serial('Not auto-confirm international order', async t => {
    let item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])

    let stripeData = {
        "type": "card",
        "card[cvc]": "222",
        "card[exp_month]": "02",
        "card[exp_year]": "22",
        "card[number]": "4000000000000077",
        "key": config.stripeKey
    }

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses
    checkoutInput.stripeSource = await request.postFormUrl('/v1/sources', stripeData,
        t.context['cookie'], config.stripeBase).then(res => res.body)

    let checkout = await request.checkoutStripe(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])
    t.deepEqual(order.status, 'placed')
    t.true(order.isCrossBorder)
})

test.serial('Auto-confirm order for regular customer', async t => {
    // regular customer has at least 1 order with status 'delivered'/'return request'/'returned'
    // new order must use same address with old order

    if (process.env.NODE_ENV == 'prod') {
        t.pass()
    } else {
        // 1st checkout to get placed order
        let item = await requestProduct.getInStockProduct(config.api.currentSales, 2)
        await requestCart.addToCart(item.id, t.context['cookie'])

        checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
        checkoutInput.addresses = addresses

        let checkout = await request.checkoutCod(checkoutInput, t.context['cookie'])
        t.truthy(checkout.orderId)

        let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])
        t.deepEqual(order.status, 'placed')

        // update 1st checkout order status
        await access.updateOrderStatus(order.code, 'delivered')

        // 2nd checkout
        await requestCart.addToCart(item.id, t.context['cookie'])

        checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
        checkout = await request.checkoutCod(checkoutInput, t.context['cookie'])
        order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])
        t.deepEqual(order.status, 'confirmed')
    }
})