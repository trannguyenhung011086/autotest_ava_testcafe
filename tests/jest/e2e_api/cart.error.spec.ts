import { config } from '../../../config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let item: Model.Product
let cart: Model.Cart
let cookie: string

let request = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils
let access = new Utils.DbAccessUtils

export const CartErrorTest = () => {
    beforeAll(async () => {
        cookie = await request.getGuestCookie()
    })

    it('POST / cannot add invalid product to cart', async () => {
        let res = await request.post(config.api.cart, {
            "productId": "INVALID-ID"
        }, cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('COULD_NOT_ADD_ITEM_TO_CART')
    })

    it('POST / cannot add empty product to cart', async () => {
        let res = await request.post(config.api.cart, {
            "productId": ""
        }, cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('COULD_NOT_ADD_ITEM_TO_CART')
    })

    it('POST / cannot add sold out product to cart', async () => {
        const soldOut = await requestProduct.getSoldOutProductInfo(config.api.currentSales)

        let res = await request.post(config.api.cart, {
            "productId": soldOut.products[0].id
        }, cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('COULD_NOT_ADD_ITEM_TO_CART')
    })

    it('POST / cannot add sale ended product to cart', async () => {
        let endedSale = await access.getSale({
            endDate: { $lt: new Date() }
        })

        let item = await access.getProduct({
            _id: endedSale.products[0].product
        })

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('COULD_NOT_ADD_ITEM_TO_CART')
    })

    it('PUT / cannot update quantity in cart to 0', async () => {
        item = await requestProduct.getInStockProduct(config.api.todaySales, 1)

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.put(config.api.cart + cart.id, {
            "quantity": 0
        }, cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('COULD_NOT_UPDATE_ITEM_QUANTITY')
    })

    it('PUT / cannot update invalid quantity in cart', async () => {
        item = await requestProduct.getInStockProduct(config.api.currentSales, 1)

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.put(config.api.cart + cart.id, {
            "quantity": -1
        }, cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('COULD_NOT_UPDATE_ITEM_QUANTITY')
    })

    it('PUT / cannot update more than max quantity in cart', async () => {
        item = await requestProduct.getInStockProduct(config.api.featuredSales, 1)

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.put(config.api.cart + cart.id, {
            "quantity": 10
        }, cookie)

        expect(res.statusCode).toEqual(403)
        expect(res.body.message).toEqual('ALREADY_REACHED_MAX_QUANTITY')
    })

    it('DELETE / cannot remove product from cart with wrong cart item', async () => {
        item = await requestProduct.getInStockProduct(config.api.todaySales, 1)

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.delete(config.api.cart + 'INVALID-CART-ID', cookie)

        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('NO_CART_ITEM_MATCHING_THAT_ID_EXISTS_IN_THE_USER_CART')
    })

    it('DELETE / cannot remove product from cart without cart item', async () => {
        item = await requestProduct.getInStockProduct(config.api.todaySales, 1)

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.delete(config.api.cart, cookie)

        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('Not found')
    })
}

describe('Cart API - Error ' + config.baseUrl + config.api.cart, CartErrorTest)