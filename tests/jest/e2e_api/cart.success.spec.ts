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
        await request.emptyCart()
    })

    it('POST / add product to cart as guest', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        expect(response.status).toEqual(200)
        expect(cart.id).not.toBeEmpty()
        expect(cart.productId).toEqual(item.id)
        expect(cart.title).not.toBeEmpty()

        expect(cart.brand._id).not.toBeEmpty()
        expect(cart.brand.__v).toBeNumber()
        expect(new Date(cart.brand.createdAt)).toBeValidDate()
        expect(new Date(cart.brand.updatedAt)).toBeValidDate()
        expect(cart.brand.description).not.toBeEmpty()
        expect(cart.brand.logo).not.toBeEmpty()
        expect(cart.brand.name).not.toBeEmpty()

        expect(cart.image.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)
        expect(cart.quantity).toEqual(1)
        expect(cart.retailPrice).toBeGreaterThan(cart.salePrice)
        expect(cart.availableQuantity).toBeGreaterThanOrEqual(1)
        expect(cart.slug).toInclude(cart.productContentId)
        expect(cart.categories.length).toBeGreaterThanOrEqual(1)
        expect(cart.international).toBeBoolean()
        expect(cart.country).not.toBeEmpty()
        expect(cart.saleEnded).toBeFalse()
    })

    it('POST / add same product to cart', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 3)
        let response = await request.post(config.api.cart, { "productId": item.id })

        cart = response.data
        expect(cart.quantity).toEqual(1)

        response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data
        expect(cart.quantity).toEqual(2)
    })

    it('POST / add sold out product to cart', async () => {
        const soldOut = await request.getSoldOutProduct(config.api.todaySales)
        let response = await request.post(config.api.cart, {
            "productId": soldOut.products[0].id
        })
        cart = response.data
        expect(cart.quantity).toEqual(1)
        expect(cart.availableQuantity).toEqual(0)
    })

    it('DELETE / remove product from cart', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.delete(config.api.cart + cart.id)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('ITEM_REMOVED_FROM_CART')
    })

    it('PUT / remove multiple products from cart', async () => {
        let itemA = await request.getInStockProduct(config.api.featuredSales, 1)
        let response = await request.post(config.api.cart, { "productId": itemA.id })
        let cartA = response.data

        let itemB = await request.getInStockProduct(config.api.potdSales, 1)
        response = await request.post(config.api.cart, { "productId": itemB.id })
        let cartB = response.data

        response = await request.put(config.api.cart + 'delete-multiple',
            { "cartItemIds": [cartA.id, cartB.id] })
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('ITEM_REMOVED_FROM_CART')
    })

    it('POST / update cart after sign in', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        let signIn = await request.post(config.api.signIn,
            {
                "email": config.testAccount.email,
                "password": config.testAccount.password
            })

        expect(signIn.data.cart).toContainEqual(cart)
    })
}

describe('Cart API - Success ' + config.baseUrl + config.api.cart, CartSuccessTest)