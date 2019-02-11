import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as Model from '../../../common/interface'
let customer: Model.Customer
let account: Model.Account
let addresses: Model.Addresses
let item: Model.Product
let cart: Model.Cart
let cookie: string

export const CheckoutErrorTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
        customer = await access.getCustomerInfo({ email: account.email })
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    afterAll(async () => {
        await request.deleteAddresses(cookie)
    })

    // validate required data

    it('POST / cannot checkout with invalid cookie', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)

        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "FREE"
        }, 'abc=abc')

        expect(res.statusCode).toEqual(500)
    })

    it('POST / cannot checkout with empty data', async () => {
        let res = await request.post(config.api.checkout, {}, cookie)
        expect(res.statusCode).toEqual(500)
    })

    it('POST / cannot checkout without address', async () => {
        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": {},
                "billing": {}
            }
        }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toContainEqual('SHIPPING_ADDRESS_REQUIRED')
        expect(res.body.message).toContainEqual('BILLING_ADDRESS_REQUIRED')
    })

    it('POST / cannot checkout with empty cart', async () => {
        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": []
        }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toContainEqual('THERE_ARE_NO_ITEMS_IN_YOUR_ORDER')
    })

    it('POST / cannot checkout with invalid phone and tax code', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toContainEqual('SHIPPING_PHONE_NUMBER_IS_NOT_VALID')
        expect(res.body.message).toContainEqual('BILLING_PHONE_NUMBER_IS_NOT_VALID')
        expect(res.body.message).toContainEqual('INVALID_BILLING_TAX_CODE')
    })

    it('POST / cannot checkout without payment method', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toContainEqual('PLEASE_SELECT_A_PAYMENT_METHOD')
    })

    // validate cart

    it('POST / cannot checkout with mismatched cart', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('CART_MISMATCH')
    })

    it('POST / cannot checkout with mismatched quantity', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message[0].message).toEqual('QUANTITY_SUBMITTED_NOT_MATCH_IN_THE_CART')
    })

    it('POST / cannot checkout with mismatched price', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": [{
                "id": cart.id,
                "quantity": 1,
                "salePrice": cart.salePrice - 1
            }],
            "method": "FREE"
        }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message[0].message).toEqual('PRICE_MISMATCH')
    })

    it('POST / cannot checkout with invalid product', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        let res = await request.post(config.api.cart, {
            "productId": item.id
        }, cookie)
        cart = res.body

        res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message[0].message).toEqual('CART_MISMATCH_CANT_FIND_PRODUCT')
    })

    it('POST / cannot checkout with more than 8 unique products', async () => {
        let items = await request.getInStockProducts(config.api.todaySales, 1)

        for (let item of items) {
            await request.addToCart(item.id, cookie, false)
        }
        account = await request.getAccountInfo(cookie)

        if (account.cart.length <= 8) {
            throw 'Cart does not have more than 8 unique products!'
        }

        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "FREE"
        }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('CART_EXCEEDS_THE_MAXIMUM_SIZE')
        expect(res.body.values.quantity).toEqual(8)
    })

    // validate availability

    it.skip('POST / cannot checkout with sold out product', async () => {
        let soldOut = await request.getSoldOutProduct(config.api.currentSales)
        await request.addToCart(soldOut.products[0].id, cookie)
        // after Netsuite integration, API does not allow to add sold out product to cart anymore -> need another workaround

        account = await request.getAccountInfo(cookie)

        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "FREE"
        }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message[0].message).toEqual('TITLE_IS_OUT_OF_STOCK')
        expect(res.body.message[0].values.title).toEqual(soldOut.title)
        expect(res.body.cart).toBeArrayOfSize(0)
    })

    it.skip('POST / cannot checkout with sale ended product', async () => {
        let endedSale = await access.getSale({
            startDate: { $gte: new Date('2018-11-11 01:00:00.000Z') },
            endDate: { $lt: new Date() }
        })
        let item = await access.getProduct({
            _id: endedSale.products[0].product
        })

        await request.addToCart(item.variations[0]._id, cookie)
        // after Netsuite integration, API does not allow to add sale ended product to cart anymore -> need another workaround

        account = await request.getAccountInfo(cookie)

        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "FREE"
        }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message[0].message).toEqual('THE_SALE_FOR_TITLE_HAS_ENDED')
        expect(res.body.message[0].values.title).toEqual(item.name)
        expect(res.body.cart).toBeArrayOfSize(0)
    })

    // validate voucher

    it('POST / cannot checkout with voucher not meeting min items', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $gte: 2 }
        })

        item = await request.getInStockProduct(config.api.todaySales, 1)

        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let res = await request.post(config.api.checkout, {
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
        
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('NOT_MEET_MINIMUM_ITEMS')
        expect(res.body.data.voucher.numberOfItems).toEqual(voucher.numberOfItems)

    })

    it('POST / cannot checkout with voucher not applied for today', async () => {
        const today = new Date().getDay()
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            specificDays: { $size: 1 },
            'specificDays.0': { $exists: true, $ne: today }
        })

        item = await request.getInStockProduct(config.api.todaySales, 1)

        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('VOUCHER_NOT_APPLY_FOR_TODAY')
        expect(res.body.data.voucher.specificDays).toEqual(voucher.specificDays)
    })

    it('POST / cannot checkout with voucher not meeting min purchase', async () => {
        item = await request.getProductWithCountry('VN', 0, 500000, 1)
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: { $exists: false },
            minimumPurchase: { $gte: 500000 }
        })

        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('TOTAL_VALUE_LESS_THAN_VOUCHER_MINIMUM')
    })

    it('POST / cannot checkout with voucher exceeding number of usage', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            multipleUser: true,
            numberOfUsage: 1,
            used: false
        }, customer)

        await request.createCodOrder([item], voucher._id)

        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('EXCEED_TIME_OF_USAGE')
    })

    it('POST / cannot checkout with expired voucher', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getVoucher({
            expiry: { $lt: new Date() },
            binRange: { $exists: false },
            used: false
        })

        let res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('VOUCHER_OR_NOT_VALID')
    })

    it('POST / cannot checkout with redeemed voucher', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getVoucher({
            expiry: { $lt: new Date() },
            binRange: { $exists: false },
            used: true
        })

        let res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('VOUCHER_OR_NOT_VALID')
    })

    it('POST / cannot checkout with COD using voucher for CC', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            binRange: { $exists: true },
            used: false,
            minimumPurchase: { $lte: item.salePrice }
        })

        let res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('REQUIRES_CC_PAYMENT')
    })

    it('POST / cannot checkout with voucher for Stripe using wrong bin range (skip-prod)', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
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
            "key": config.stripeKey
        }
        const stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase)

        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "STRIPE",
            "methodData": stripeSource.body,
            "shipping": 0,
            "voucher": voucher._id,
            "accountCredit": account.accountCredit
        }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('THIS_CC_NOT_ACCEPTABLE')
    })

    it('POST / cannot checkout with already used voucher (skip-prod)', async () => {
        // need to exclude this 
        item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            used: false,
            discountType: 'amount',
            minimumPurchase: 0,
            numberOfItems: 0,
            oncePerAccount: true
        }, customer)

        await request.createCodOrder([item], voucher._id)

        item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('YOU_ALREADY_USED_THIS_VOUCHER')
    })

    it('POST / cannot checkout with voucher only used for other customer', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            customer: { $exists: true, $ne: customer._id }
        })

        let res = await request.post(config.api.checkout, {
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

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('NOT_ALLOWED_TO_USE_VOUCHER')
    })

    // validate account credit

    it('POST / cannot checkout with more than available credit', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000,
            "accountCredit": account.accountCredit + 1
        }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('USER_SPEND_MORE_CREDIT_THAN_THEY_HAVE')
    })
}

describe('Checkout API - Error ' + config.baseUrl + config.api.checkout, CheckoutErrorTest)