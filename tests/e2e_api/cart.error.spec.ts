import config from '../../config/config'
import { Utils } from '../../common'
import 'jest-extended'
let request = new Utils()
import * as Model from '../../common/interface'
let item: Model.Product
let cart: Model.Cart
let response: any
let cookie: string

describe('Cart API - Error' + config.baseUrl + config.api.cart, () => {
    beforeAll(async () => {
        item = await request.getInStockProduct(config.api.currentSales, 3)
        response = await request.post(config.api.cart, { "productId": item.id })
        cookie = response.headers['set-cookie'][0]
    })

    test('POST / cannot add invalid product to cart', async () => {
        response = await request.post(config.api.cart, { "productId": "INVALID-ID" })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_ADD_ITEM_TO_CART')
    })

    test('POST / cannot add empty product to cart', async () => {
        response = await request.post(config.api.cart, { "productId": "" })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_ADD_ITEM_TO_CART')
    })

    test('PUT / cannot update quantity in cart to 0', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 3)
        response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data

        response = await request.put(config.api.cart + cart.id, { "quantity": 0 }, cookie)
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_UPDATE_ITEM_QUANTITY')
    })

    test('PUT / cannot update more than max quantity in cart', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 3)
        response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data

        response = await request.put(config.api.cart + cart.id, { "quantity": 6 }, cookie)
        expect(response.status).toEqual(403)
        expect(response.data.message).toEqual('ALREADY_REACHED_MAX_QUANTITY')
    })

    test('PUT / cannot update invalid quantity in cart', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 3)
        response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data

        response = await request.put(config.api.cart + cart.id, { "quantity": -1 }, cookie)
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_UPDATE_ITEM_QUANTITY')
    })

    test('DELETE / cannot remove product from cart with wrong cart item', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.delete(config.api.cart + 'INVALID-CART-ID')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('NO_CART_ITEM_MATCHING_THAT_ID_EXISTS_IN_THE_USER_CART')
    })

    test('DELETE / cannot remove product from cart without cart item', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.delete(config.api.cart)
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('Not found')
    })
})