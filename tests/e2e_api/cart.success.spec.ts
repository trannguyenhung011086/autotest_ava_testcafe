import config from '../../config/config'
import { Utils } from '../../common'
import 'jest-extended'
let request = new Utils()
import * as Model from '../../common/interface'
let item: Model.Product
let cart: Model.Cart
let response: any
let cookie: string

describe('Cart API - Success ' + config.baseUrl + config.api.cart, () => {
    beforeAll(async () => {
        response = await request.get(config.api.account)
        cookie = response.headers['set-cookie'][0]
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    test('POST / add product to cart as guest', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        response = await request.post(config.api.cart, { "productId": item.id })
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

        expect(cart.image).toMatch(/https:\/\/leflair-assets.storage.googleapis.com\/.+\.jpg/)
        expect(cart.quantity).toEqual(1)
        expect(cart.retailPrice).toBeGreaterThan(cart.salePrice)
        expect(cart.availableQuantity).toBeGreaterThanOrEqual(1)
        expect(cart.slug).toInclude(cart.productContentId)
        expect(cart.categories.length).toBeGreaterThanOrEqual(1)
        expect(cart.international).toBeBoolean()
        expect(cart.country).not.toBeEmpty()
        expect(cart.saleEnded).toBeFalse()
    })

    test('POST / add same product to cart', async () => {
        await request.emptyCart(cookie)

        item = await request.getInStockProduct(config.api.currentSales, 3)
        response = await request.post(config.api.cart, { "productId": item.id })

        cart = response.data
        expect(cart.quantity).toEqual(1)

        response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data
        expect(cart.quantity).toEqual(2)
    })

    test('PUT / update quantity in cart', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 3)
        response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.put(config.api.cart + cart.id, { "quantity": 3 }, cookie)
        cart = response.data
        expect(cart.quantity).toEqual(3)
    })

    test('DELETE / remove product from cart', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.delete(config.api.cart + cart.id, cookie)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('ITEM_REMOVED_FROM_CART')
    })

    test('POST / update cart after log in', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data

        let login = await request.post(config.api.login,
            {
                "email": config.testAccount.email, "password": config.testAccount.password
            }, cookie)

        expect(login.data.cart).toContainEqual(cart)
    })
})