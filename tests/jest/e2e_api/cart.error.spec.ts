import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as Model from '../../../common/interface'
let item: Model.Product
let cart: Model.Cart
let cookie: string

export const CartErrorTest = () => {
    beforeAll(async () => {
        cookie = await request.getGuestCookie()
    })

    it('POST / cannot add invalid product to cart', async () => {
        let response = await request.post(config.api.cart, { "productId": "INVALID-ID" })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_ADD_ITEM_TO_CART')
    })

    it('POST / cannot add empty product to cart', async () => {
        let response = await request.post(config.api.cart, { "productId": "" })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_ADD_ITEM_TO_CART')
    })

    it('PUT / cannot update quantity in cart to 0', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 3)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.put(config.api.cart + cart.id, { "quantity": 0 })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_UPDATE_ITEM_QUANTITY')
    })

    it('PUT / cannot update invalid quantity in cart', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 3)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.put(config.api.cart + cart.id, { "quantity": -1 })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_UPDATE_ITEM_QUANTITY')
    })

    it('PUT / cannot update more than max quantity in cart', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 3)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.put(config.api.cart + cart.id, { "quantity": 6 })
        expect(response.status).toEqual(403)
        expect(response.data.message).toEqual('ALREADY_REACHED_MAX_QUANTITY')
    })

    it('DELETE / cannot remove product from cart with wrong cart item', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.delete(config.api.cart + 'INVALID-CART-ID')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('NO_CART_ITEM_MATCHING_THAT_ID_EXISTS_IN_THE_USER_CART')
    })

    it('DELETE / cannot remove product from cart without cart item', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.delete(config.api.cart)
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('Not found')
    })
}

describe('Cart API - Error ' + config.baseUrl + config.api.cart, CartErrorTest)