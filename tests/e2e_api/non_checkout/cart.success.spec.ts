import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let item: Model.Product
let cart: Model.Cart

let request = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils

import test from 'ava'

test.beforeEach(async t => {
    t.context['cookie'] = await request.getGuestCookie()
    await request.emptyCart(t.context['cookie'])
})

test('POST / add product to cart as guest', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)

    const res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
    cart = res.body

    t.deepEqual(res.statusCode, 200)
    t.truthy(cart.id)
    t.deepEqual(cart.productId, item.id)
    t.truthy(cart.title)
    t.true(request.validateImage(cart.image))
    t.deepEqual(cart.quantity, 1)
    t.true(cart.retailPrice >= cart.salePrice)
    t.true(cart.availableQuantity >= 1)
    t.true(cart.slug.includes(cart.productContentId))
    t.truthy(cart.categories)
    t.regex(cart.country, /VN|SG/)
    t.false(cart.saleEnded)
    t.truthy(cart.nsId)
})

test('POST / add same product to cart', async t => {
    item = await requestProduct.getInStockProduct(config.api.currentSales, 2)

    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])

    cart = res.body

    t.deepEqual(cart.quantity, 1)

    res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])

    cart = res.body

    t.deepEqual(cart.quantity, 2)
})

test('DELETE / remove product from cart', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)

    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
    cart = res.body

    res = await request.delete(config.api.cart + cart.id, t.context['cookie'])

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(res.body.message, 'ITEM_REMOVED_FROM_CART')
})

test('PUT / remove multiple products from cart', async t => {
    let itemA = await requestProduct.getInStockProduct(config.api.featuredSales, 1)

    let res = await request.post(config.api.cart, {
        "productId": itemA.id
    }, t.context['cookie'])
    let cartA = res.body

    let itemB = await requestProduct.getInStockProduct(config.api.potdSales, 1)

    res = await request.post(config.api.cart, {
        "productId": itemB.id
    }, t.context['cookie'])
    let cartB = res.body

    res = await request.put(config.api.cart + 'delete-multiple', {
        "cartItemIds": [cartA.id, cartB.id]
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(res.body.message, 'ITEM_REMOVED_FROM_CART')
})

test('POST / update cart after sign in', async t => {
    item = await requestProduct.getInStockProduct(config.api.featuredSales, 1)

    const res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
    cart = res.body

    let signIn = await request.post(config.api.signIn,
        {
            "email": config.testAccount.email_ex[2],
            "password": config.testAccount.password_ex
        }, t.context['cookie'])

    t.deepEqual(signIn.body.cart[0], cart)
})