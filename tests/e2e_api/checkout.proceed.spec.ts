import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let checkout: Model.Checkout
let item: Model.Product
let cart: Model.Cart
let cookie: string

let helper = new Utils.Helper
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils

import test from 'ava'

test.before(async t => {
    cookie = await helper.getGuestCookie()
})

test.beforeEach(async t => {
    await requestCart.emptyCart(cookie)
})

test('GET / proceed checkout with empty cart', async t => {
    let res = await helper.get(config.api.checkout, cookie)
    checkout = res.body

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(checkout.cart.length, 0)
})

test('GET / proceed checkout with cart', async t => {
    item = await requestProduct.getInStockProduct(config.api.featuredSales, 1)

    let res = await helper.post(config.api.cart, {
        "productId": item.id
    }, cookie)
    cart = res.body

    res = await helper.get(config.api.checkout, cookie)
    checkout = res.body

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(checkout.cart[0], cart)
})