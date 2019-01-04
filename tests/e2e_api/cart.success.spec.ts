import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as Model from '../../common/interface'
let item: Model.Product
let cart: Model.Cart
let cookie: string

describe('Cart API - Success ' + config.baseUrl + config.api.cart, () => {
    beforeAll(async () => {
        cookie = await request.getGuestCookie()
    })

    afterEach(async () => {
        await request.emptyCart()
    })

    test('POST / add product to cart as guest', async () => {
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

    test('POST / add same product to cart', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 3)
        let response = await request.post(config.api.cart, { "productId": item.id })

        cart = response.data
        expect(cart.quantity).toEqual(1)

        response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data
        expect(cart.quantity).toEqual(2)
    })

    test('POST / add sold out product to cart', async () => {
        const soldOut = await request.getSoldOutProduct(config.api.todaySales)
        let response = await request.post(config.api.cart, {
            "productId": soldOut.products[0].id
        })
        cart = response.data
        expect(cart.quantity).toEqual(1)
        expect(cart.availableQuantity).toEqual(0)
    })

    test('PUT / update quantity in cart', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 3)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.put(config.api.cart + cart.id, { "quantity": 3 })
        cart = response.data
        expect(cart.quantity).toEqual(3)
    })

    test('DELETE / remove product from cart', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        response = await request.delete(config.api.cart + cart.id)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('ITEM_REMOVED_FROM_CART')
    })

    test('PUT / remove multiple products from cart', async () => {
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

    test('POST / update cart after log in', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id })
        cart = response.data

        let login = await request.post(config.api.signIn,
            {
                "email": config.testAccount.email,
                "password": config.testAccount.password
            })

        expect(login.data.cart).toContainEqual(cart)
    })
})