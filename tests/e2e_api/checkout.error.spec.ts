import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as Model from '../../common/interface'
let customer: Model.Customer
let account: Model.Account
let addresses: Model.Addresses
let creditcard: Model.CreditCardModel
let checkout: Model.Checkout
let item: Model.Product
let cart: Model.Cart
let cookie: string
const stripe = require('stripe')(config.stripeKey)

describe('Checkout API - Logged in - Error ' + config.baseUrl + config.api.cart, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
        customer = await access.getCustomerInfo({ email: account.email })
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    // validate required data

    test('POST / cannot checkout with invalid email', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 1)

        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "FREE"
        }, 'abc')

        expect(response.status).toEqual(400)
        expect(response.data.message).toContainEqual('EMAIL_ADDRESS_REQUIRED')
        expect(response.data.message).toContainEqual('EMAIL_ADDRESS_NOT_WELL_FORMAT')
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

    // validate cart

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

    test('POST / cannot checkout with mismatched quantity', async () => {
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

        expect(response.status).toEqual(400)
        expect(response.data.message[0].message).toEqual('QUANTITY_SUBMITTED_NOT_MATCH_IN_THE_CART')
    })

    test('POST / cannot checkout with mismatched price', async () => {
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
                "quantity": 1,
                "salePrice": cart.salePrice + 1
            }],
            "method": "FREE"
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message[0].message).toEqual('PRICE_MISMATCH')
    })

    test('POST / cannot checkout with mismatched price', async () => {
        item = await request.getInStockProduct(config.api.currentSales, 1)
        let response = await request.post(config.api.cart, { "productId": item.id }, cookie)
        cart = response.data

        response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": [{
                "id": "INVALID-ID",
                "quantity": 1,
                "salePrice": cart.salePrice
            }],
            "method": "FREE"
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message[0].message).toEqual('CART_MISMATCH_CANT_FIND_PRODUCT')
    })

    test('POST / cannot checkout with more than 8 unique products', async () => {
        let items = await request.getInStockProducts(config.api.currentSales, 2)

        for (let item of items) {
            await request.addToCart(item.id, cookie, false)
        }
        account = await request.getAccountInfo(cookie)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "FREE"
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('CART_EXCEEDS_THE_MAXIMUM_SIZE')
        expect(response.data.values.quantity).toEqual(8)
    })

    // validate availability

    test('POST / cannot checkout with sold out product', async () => {
        let soldOut = await request.getSoldOutProduct(config.api.featuredSales)
        await request.addToCart(soldOut.products[0].id, cookie)
        account = await request.getAccountInfo(cookie)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "FREE"
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message[0].message).toEqual('TITLE_IS_OUT_OF_STOCK')
        expect(response.data.message[0].values.title).toEqual(soldOut.title)
        expect(response.data.data.cart).toBeArrayOfSize(0)
    })

    test('POST / cannot checkout with sale ended product', async () => {
        let endedSale = await access.getEndedSale({
            startDate: { $gte: new Date('2018-11-11 01:00:00.000Z') },
            endDate: { $lt: new Date() }
        })
        let item = await access.getProduct({
            _id: endedSale.products[0].product
        })

        await request.addToCart(item.variations[0]._id, cookie)
        account = await request.getAccountInfo(cookie)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "FREE"
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message[0].message).toEqual('THE_SALE_FOR_TITLE_HAS_ENDED')
        expect(response.data.message[0].values.title).toEqual(item.name)
        expect(response.data.data.cart).toBeArrayOfSize(0)
    })

    // validate voucher

    test('POST / cannot checkout with voucher not meeting min items', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $gte: 2 }
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let item = await request.getInStockProduct(config.api.currentSales, 1)

        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000,
            "voucher": voucher._id,
            "accountCredit": account.accountCredit
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('NOT_MEET_MINIMUM_ITEMS')
        expect(response.data.data.voucher.numberOfItems).toEqual(voucher.numberOfItems)

    })

    test('POST / cannot checkout with voucher not applied for today', async () => {
        const today = new Date().getDay()
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            specificDays: { $size: 1 },
            'specificDays.0': { $exists: true, $ne: today }
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let item = await request.getInStockProduct(config.api.currentSales, 1)

        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000,
            "voucher": voucher._id,
            "accountCredit": account.accountCredit
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('VOUCHER_NOT_APPLY_FOR_TODAY')
        expect(response.data.data.voucher.specificDays).toEqual(voucher.specificDays)
    })

    test('POST / cannot checkout with voucher not meeting min purchase', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            minimumPurchase: { $gte: account.cart[0].salePrice }
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000,
            "voucher": voucher._id,
            "accountCredit": account.accountCredit
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('TOTAL_VALUE_LESS_THAN_VOUCHER_MINIMUM')
    })

    test('POST / cannot checkout with voucher exceeding number of usage', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let vouchers = await access.getVoucherList({
            expiry: { $gte: new Date() },
            oncePerAccount: true,
            numberOfUsage: { $gte: 1 }
        })
        let matchedVoucher: Model.VoucherModel

        for (let voucher of vouchers) {
            const used = await access.countUsedVoucher(voucher._id)
            if (voucher.numberOfUsage <= used) {
                matchedVoucher = voucher
                break
            }
        }

        if (!matchedVoucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000,
            "voucher": matchedVoucher._id,
            "accountCredit": account.accountCredit
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('EXCEED_TIME_OF_USAGE')
    })

    test('POST / cannot checkout with expired voucher', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getVoucher({
            expiry: { $lt: new Date() },
            binRange: { $exists: false },
            used: false
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000,
            "voucher": voucher._id,
            "accountCredit": account.accountCredit
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('VOUCHER_OR_NOT_VALID')
    })

    test('POST / cannot checkout with COD using voucher for CC', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            binRange: { $exists: true },
            used: false,
            minimumPurchase: { $lte: item.salePrice }
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000,
            "voucher": voucher._id,
            "accountCredit": account.accountCredit
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('REQUIRES_CC_PAYMENT')
    })

    test('POST / cannot checkout with voucher for Stripe using wrong bin range', async () => {
        let item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            binRange: { $exists: true },
            used: false,
            minimumPurchase: { $lte: item.salePrice }
        })

        const stripeData = {
            "type": "card",
            "card[number]": "4000000000003063",
            "card[cvc]": "222",
            "card[exp_month]": "02",
            "card[exp_year]": "22",
            "guid": "d7954ec1-b754-4de9-aff1-47f65a90f988",
            "muid": "4f81e594-2a7c-4ddb-b966-db9db589e63f",
            "sid": "4f81e594-2a7c-4ddb-b966-db9db589e63f",
            "pasted_fields": "number",
            "payment_user_agent": "stripe.js/596ce0d0; stripe-js-v3/596ce0d0",
            "referrer": "https://secure.staging.leflair.io/checkout?language=vn",
            "key": config.stripeKey
        }
        const stripeSource = await stripe.sources.create(stripeData)

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "STRIPE",
            "methodData": stripeSource,
            "shipping": 0,
            "voucher": voucher._id,
            "accountCredit": account.accountCredit
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('THIS_CC_NOT_ACCEPTABLE')
    })

    test('POST / cannot checkout with already used voucher', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)
        customer = await access.getCustomerInfo({ email: account.email })

        let vouchers = await access.getVoucherList({
            expiry: { $gte: new Date() },
            binRange: { $exists: false },
            used: false
        })
        let matchedVoucher: Model.VoucherModel

        for (let voucher of vouchers) {
            const checkUsed = await access.checkUsedVoucher(voucher._id, customer._id)
            if (voucher.oncePerAccount && checkUsed) {
                matchedVoucher = voucher
                break
            }
        }

        if (!matchedVoucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000,
            "voucher": matchedVoucher._id,
            "accountCredit": account.accountCredit
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('YOU_ALREADY_USED_THIS_VOUCHER')
    })

    test('POST / cannot checkout with voucher only used for other customer', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)
        customer = await access.getCustomerInfo({ email: account.email })

        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: { $exists: false },
            customer: { $exists: true, $ne: customer._id }
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000,
            "voucher": voucher._id,
            "accountCredit": account.accountCredit
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('NOT_ALLOWED_TO_USE_VOUCHER')
    })

    // validate account credit

    test('POST / cannot checkout with more than available credit', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000,
            "accountCredit": account.accountCredit + 1
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('USER_SPEND_MORE_CREDIT_THAN_THEY_HAVE')
    })
})