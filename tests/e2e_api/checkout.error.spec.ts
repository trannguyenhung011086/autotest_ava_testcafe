import config from '../../config/config'
import { Utils } from '../../common'
import 'jest-extended'
let request = new Utils()
import * as Model from '../../common/interface'
let account: Model.Account
let addresses: Model.Addresses
let creditcard: Model.CreditCardModel
let checkout: Model.Checkout
let item: Model.Product
let cart: Model.Cart
let cookie: string
let cartData = {
    "email": "qa_tech@leflair.vn",
    "address": {
        "shipping": {
            "id": "5bfbb26f18246700010e4c41",
            "firstName": "Phan",
            "lastName": "Nhân",
            "phone": "35955",
            "address": "150 Vương Vista",
            "district": {
                "id": "578c1c2c4bda02a85e93f254",
                "name": "Huyện Kim Sơn"
            },
            "city": {
                "id": "578c1c2c4bda02a85e93f1c6",
                "name": "Ninh Bình"
            },
            "default": true
        },
        "billing": {
            "id": "5bfbb27218246700010e4c42",
            "nsId": "907323",
            "firstName": "Phan",
            "lastName": "Nhân",
            "taxCode": "97436",
            "phone": "01992250922",
            "address": "150 Vương Vista",
            "district": {
                "id": "578c1c2c4bda02a85e93f254",
                "name": "Huyện Kim Sơn"
            },
            "city": {
                "id": "578c1c2c4bda02a85e93f1c6",
                "name": "Ninh Bình"
            },
            "default": true
        }
    },
    "cart": [{
        "id": "5bfba77f9ab4c80001024a72",
        "quantity": 1,
        "salePrice": 429000
    }],
    "shipping": 0,
    "accountCredit": 429000,
    "method": "FREE"
}

describe('Checkout API - Logged in - Error ' + config.baseUrl + config.api.cart, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        account = await request.getAccountInfo(cookie)
        addresses = await request.getAddresses(cookie)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    test('POST / cannot checkout with empty data', async () => {
        let response = await request.post(config.api.checkout, {}, cookie)
        expect(response.status).toEqual(500)
    })

    test('POST / cannot checkout without address', async () => {
        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": {},
                "billing": {}
            }
        }, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toContainEqual('SHIPPING_ADDRESS_REQUIRED')
        expect(response.data.message).toContainEqual('BILLING_ADDRESS_REQUIRED')
    })

    test('POST / cannot checkout with empty cart', async () => {
        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": []
        }, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toContainEqual('THERE_ARE_NO_ITEMS_IN_YOUR_ORDER')
    })

    test.skip('POST / cannot checkout with invalid email', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data

        response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": [{
                "id": cart.id,
                "quantity": cart.quantity,
                "salePrice": cart.salePrice
            }],
            "email": "INVALID-EMAIL",
            "method": "FREE"
        }, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toContainEqual('EMAIL_ADDRESS_NOT_WELL_FORMAT')
    })

    test('POST / cannot checkout with invalid phone and tax code', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data

        response = await request.post(config.api.checkout, {
            "address": {
                "shipping": {
                    "phone": "35955"
                },
                "billing": {
                    "taxCode": "97436",
                    "phone": "4353"
                }
            },
            "cart": [{
                "id": cart.id,
                "quantity": cart.quantity,
                "salePrice": cart.salePrice
            }]
        }, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toContainEqual('SHIPPING_PHONE_NUMBER_IS_NOT_VALID')
        expect(response.data.message).toContainEqual('BILLING_PHONE_NUMBER_IS_NOT_VALID')
        expect(response.data.message).toContainEqual('INVALID_BILLING_TAX_CODE')
    })

    test('POST / cannot checkout without payment method', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data

        response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": [{
                "id": cart.id,
                "quantity": cart.quantity,
                "salePrice": cart.salePrice
            }]
        }, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toContainEqual('PLEASE_SELECT_A_PAYMENT_METHOD')
    })

    test('POST / cannot checkout with mismatched cart', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data

        response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": [{
                "id": cart.id,
                "quantity": cart.quantity,
                "salePrice": cart.salePrice
            },
            {
                "id": cart.id,
                "quantity": cart.quantity,
                "salePrice": cart.salePrice
            }],
            "method": "FREE"
        }, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('CART_MISMATCH')
    })

    test.only('POST / cannot checkout with mismatched quantity', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data

        response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": [{
                "id": cart.id,
                "quantity": 2,
                "salePrice": cart.salePrice
            }],
            "method": "FREE"
        }, cookie)
        console.log(response.data.cart)
        console.log(response.data.message[0].cart)
        expect(response.status).toEqual(400)
        expect(response.data.message[0].message).toEqual('QUANTITY_SUBMITTED_NOT_MATCH_IN_THE_CART')
    })
})