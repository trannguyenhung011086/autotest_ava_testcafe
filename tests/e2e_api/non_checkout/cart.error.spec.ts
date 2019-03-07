import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let item: Model.Product
let cart: Model.Cart

let request = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils
let access = new Utils.DbAccessUtils

import test from 'ava'

test.beforeEach(async t => {
    t.context['cookie'] = await request.getGuestCookie()
})

test('POST / cannot add invalid product to cart', async t => {
    const res = await request.post(config.api.cart, {
        "productId": "INVALID-ID"
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'COULD_NOT_ADD_ITEM_TO_CART')
})

test('POST / cannot add empty product to cart', async t => {
    const res = await request.post(config.api.cart, {
        "productId": ""
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'COULD_NOT_ADD_ITEM_TO_CART')
})

test('POST / cannot add sold out product to cart', async t => {
    const soldOut = await requestProduct.getSoldOutProductInfo(config.api.currentSales)

    const res = await request.post(config.api.cart, {
        "productId": soldOut.products[0].id
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'TITLE_IS_OUT_OF_STOCK')
})

test('POST / cannot add sale ended product to cart', async t => {
    let endedSale = await access.getSale({
        endDate: { $lt: new Date() }
    })

    let item = await access.getProduct({
        _id: endedSale.products[0].product
    })

    const res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'THE_SALE_FOR_TITLE_HAS_ENDED')
})

test('PUT / cannot update quantity in cart to 0', async t => {
    item = await requestProduct.getInStockProduct(config.api.currentSales, 1)

    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
    cart = res.body

    res = await request.put(config.api.cart + cart.id, {
        "quantity": 0
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'COULD_NOT_UPDATE_ITEM_QUANTITY')
})

test('PUT / cannot update invalid quantity in cart', async t => {
    item = await requestProduct.getInStockProduct(config.api.currentSales, 1)

    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
    cart = res.body

    res = await request.put(config.api.cart + cart.id, {
        "quantity": -1
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'COULD_NOT_UPDATE_ITEM_QUANTITY')
})

test('PUT / cannot update more than max quantity in cart', async t => {
    item = await requestProduct.getInStockProduct(config.api.featuredSales, 1)

    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
    cart = res.body

    res = await request.put(config.api.cart + cart.id, {
        "quantity": 10
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 403)
    t.deepEqual(res.body.message, 'ALREADY_REACHED_MAX_QUANTITY')
})

test('DELETE / cannot remove product from cart with wrong cart item', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)

    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
    cart = res.body

    res = await request.delete(config.api.cart + 'INVALID-CART-ID', t.context['cookie'])

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'NO_CART_ITEM_MATCHING_THAT_ID_EXISTS_IN_THE_USER_CART')
})

test('DELETE / cannot remove product from cart without cart item', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)

    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
    cart = res.body

    res = await request.delete(config.api.cart, t.context['cookie'])

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'Not found')
})