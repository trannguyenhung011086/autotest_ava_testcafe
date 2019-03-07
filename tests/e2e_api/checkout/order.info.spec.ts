import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let request = new Utils.OrderUtils
let requestAccount = new Utils.AccountUtils
let requestAddress = new Utils.AddressUtils
let requestCheckout = new Utils.CheckoutUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils
let requestOrder = new Utils.OrderUtils

let item: Model.Product
let checkoutInput: Model.CheckoutInput = {}

import test from 'ava'

test.before(async t => {
    t.context['cookie'] = await request.getLogInCookie(config.testAccount.email_in,
        config.testAccount.password_in)
})

test('Compare product details from checkout to order', async t => {
    item = await requestProduct.getProductWithCountry('VN', 0, 2000000)
    let cart = await requestCart.addToCart(item.id, t.context['cookie'])

    const addresses = await requestAddress.getAddresses(t.context['cookie'])

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses

    let checkout = await requestCheckout.checkoutCod(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])

    t.deepEqual(cart.productContentId, order.products[0].productContentId)
    t.deepEqual(cart.productId, order.products[0].productId)
    t.deepEqual(cart.nsId, order.products[0].nsId)
    t.deepEqual.skip(cart.retailPrice, order.products[0].retailPrice) // wait for WWW-570 
    t.deepEqual(cart.salePrice, order.products[0].salePrice)
})

test('GET / cannot see order of another customer', async t => {
    const res = await request.get(config.api.orders + '/5be3ea348f2a5c000155efbc', t.context['cookie'])

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(res.body.length, 0)
})

test('GET / can access orders', async t => {
    const res = await request.get(config.api.orders, t.context['cookie'])
    const orders: Model.OrderSummary[] = res.body

    orders.forEach(order => {
        request.validateOrderSummary(t, order)
    })
})

test('GET / can see order info using order ID', async t => {
    const orders = await request.getOrders(t.context['cookie'])

    for (let order of orders) {
        const res = await request.get(config.api.orders + '/' + order.id, t.context['cookie'])
        const orderItem: Model.Order = res.body

        request.validateOrderDetail(t, orderItem)
    }
})

test('GET / can see order info using order code', async t => {
    const orders = await request.getOrders(t.context['cookie'])

    for (let order of orders) {
        const res = await request.get(config.api.orders + '/' + order.code, t.context['cookie'])

        if (Array.isArray(res.body)) {
            for (let item of res.body) {
                request.validateOrderDetail(t, item)
            }
        } else {
            request.validateOrderDetail(t, res.body)
        }
    }
})

test('GET / cannot access order info with invalid cookie', async t => {
    const res = await request.get(config.api.orders + '/5be3ea348f2a5c000155efbc', 'leflair.connect2.sid=test')

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'Invalid request.')
})