import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as Model from '../../../common/interface'
let item: Model.Product
let cart: Model.Cart
let cookie: string

export const CartSuccessTest = () => {
    beforeAll(async () => {
        cookie = await request.getGuestCookie()
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    it('POST / add product to cart as guest', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        expect(res.statusCode).toEqual(200)
        expect(cart.id).not.toBeEmpty()
        expect(cart.productId).toEqual(item.id)
        expect(cart.title).not.toBeEmpty()
        expect(cart.image.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)
        expect(cart.quantity).toEqual(1)
        expect(cart.retailPrice).toBeGreaterThan(cart.salePrice)
        expect(cart.availableQuantity).toBeGreaterThanOrEqual(1)
        expect(cart.slug).toInclude(cart.productContentId)
        expect(cart.categories.length).toBeGreaterThanOrEqual(1)
        expect(cart.country).not.toBeEmpty()
        expect(cart.saleEnded).toBeFalse()
        expect(cart.nsId).not.toBeEmpty()
        // expect(cart.brand._id).not.toBeEmpty()
        // expect(cart.brand.__v).toBeNumber()
        // expect(new Date(cart.brand.createdAt)).toBeBefore(new Date(cart.brand.updatedAt))
        // expect(cart.brand.description).not.toBeEmpty()
        // expect(cart.brand.logo).not.toBeEmpty()
        // expect(cart.brand.name).not.toBeEmpty()
        // expect(cart.international).toBeBoolean()
    })

    it('POST / add same product to cart', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 2)

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)

        cart = res.body
        expect(cart.quantity).toEqual(1)

        res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)

        cart = res.body
        expect(cart.quantity).toEqual(2)
    })

    it('DELETE / remove product from cart', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.delete(config.api.cart + cart.id, cookie)

        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('ITEM_REMOVED_FROM_CART')
    })

    it('PUT / remove multiple products from cart', async () => {
        let itemA = await request.getInStockProduct(config.api.featuredSales, 1)

        let res = await request.post(config.api.cart, {
            "productId": itemA.id
        }, cookie)
        let cartA = res.body

        let itemB = await request.getInStockProduct(config.api.potdSales, 1)

        res = await request.post(config.api.cart, {
            "productId": itemB.id
        }, cookie)
        let cartB = res.body

        res = await request.put(config.api.cart + 'delete-multiple', {
            "cartItemIds": [cartA.id, cartB.id]
        }, cookie)

        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('ITEM_REMOVED_FROM_CART')
    })

    it('POST / update cart after sign in', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)

        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        let signIn = await request.post(config.api.signIn,
            {
                "email": config.testAccount.email,
                "password": config.testAccount.password
            }, cookie)

        expect(signIn.body.cart).toContainEqual(cart)
    })
}

describe('Cart API - Success ' + config.baseUrl + config.api.cart, CartSuccessTest)