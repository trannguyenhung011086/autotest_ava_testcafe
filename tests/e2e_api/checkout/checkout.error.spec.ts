import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let customer: Model.Customer
let account: Model.Account
let addresses: Model.Addresses
let item: Model.Product
let cart: Model.Cart
let checkoutInput: Model.CheckoutInput = {}

let requestAddress = new Utils.AddressUtils
let requestAccount = new Utils.AccountUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils
let request = new Utils.CheckoutUtils
let access = new Utils.DbAccessUtils
let accessRedis = new Utils.RedisAccessUtils

import test from 'ava'

test.before(async t => {
    t.context['cookie'] = await request.getLogInCookie(config.testAccount.email_ex[4],
        config.testAccount.password_ex)

    addresses = await requestAddress.getAddresses(t.context['cookie'])

    account = await requestAccount.getAccountInfo(t.context['cookie'])
    customer = await access.getCustomerInfo({ email: account.email })
})

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context['cookie'])
})

// validate required data

test.serial('POST / cannot checkout with invalid cookie', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)

    await requestCart.addToCart(item.id, t.context['cookie'])
    account = await requestAccount.getAccountInfo(t.context['cookie'])

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "FREE"
    }, 'leflair.connect2.sid=test')

    t.deepEqual(res.statusCode, 500)
})

test.serial('POST / cannot checkout with empty data', async t => {
    const res = await request.post(config.api.checkout, {}, t.context['cookie'])

    t.deepEqual(res.statusCode, 500)
})

test.serial('POST / cannot checkout without address', async t => {
    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": {},
            "billing": {}
        }
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.true(res.body.message.includes('SHIPPING_ADDRESS_REQUIRED'))
    t.true(res.body.message.includes('BILLING_ADDRESS_REQUIRED'))
})

test.serial('POST / cannot checkout with empty cart', async t => {
    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": []
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.true(res.body.message.includes('THERE_ARE_NO_ITEMS_IN_YOUR_ORDER'))
})

test.serial('POST / cannot checkout with invalid phone and tax code', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
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
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.true(res.body.message.includes('SHIPPING_PHONE_NUMBER_IS_NOT_VALID'))
    t.true(res.body.message.includes('BILLING_PHONE_NUMBER_IS_NOT_VALID'))
    t.true(res.body.message.includes('INVALID_BILLING_TAX_CODE'))
})

test.serial('POST / cannot checkout without payment method', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
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
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.true(res.body.message.includes('PLEASE_SELECT_A_PAYMENT_METHOD'))
})

// validate cart

test.serial('POST / cannot checkout with mismatched cart', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
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
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'CART_MISMATCH')
})

test.serial('POST / cannot checkout with mismatched quantity', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
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
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message[0].message, 'QUANTITY_SUBMITTED_NOT_MATCH_IN_THE_CART')
})

test.serial('POST / cannot checkout with mismatched price', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
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
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message[0].message, 'PRICE_MISMATCH')
})

test.serial('POST / cannot checkout with invalid product', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    let res = await request.post(config.api.cart, {
        "productId": item.id
    }, t.context['cookie'])
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
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message[0].message, 'CART_MISMATCH_CANT_FIND_PRODUCT')
})

test.serial('POST / cannot checkout with more than 8 unique products', async t => {
    let items = await requestProduct.getInStockProducts(config.api.todaySales, 1)

    for (let item of items) {
        await requestCart.addToCart(item.id, t.context['cookie'], false)
    }
    account = await requestAccount.getAccountInfo(t.context['cookie'])

    if (account.cart.length <= 8) {
        throw 'Cart does not have more than 8 unique products!'
    }

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "FREE"
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'CART_EXCEEDS_THE_MAXIMUM_SIZE')
    t.deepEqual(res.body.values.quantity, 8)
})

// validate availability

test.serial('POST / cannot checkout with sold out product', async t => {
    if (process.env.NODE_ENV == 'prod') {
        t.pass()
    } else {
        let redisItem: string
        let originalQuantity: number

        try {
            let item = await requestProduct.getInStockProduct(config.api.featuredSales, 1)
            await requestCart.addToCart(item.id, t.context['cookie'])
            account = await requestAccount.getAccountInfo(t.context['cookie'])

            redisItem = await accessRedis.getKey('nsId:' + item.nsId)
            originalQuantity = redisItem['quantity']

            // set quantity on Redis
            redisItem['quantity'] = 0
            await accessRedis.setValue('nsId:' + item.nsId, JSON.stringify(redisItem))

            const res = await request.post(config.api.checkout, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": account.cart,
                "method": "FREE"
            }, t.context['cookie'])

            t.deepEqual(res.statusCode, 400)
            t.deepEqual(res.body.message[0].message, 'TITLE_IS_OUT_OF_STOCK')
            t.deepEqual(res.body.message[0].values.title, item.name)
        } catch (err) {
            throw err
        } finally {
            // reset quantity on Redis
            redisItem['quantity'] = originalQuantity
            await accessRedis.setValue('nsId:' + item.nsId, JSON.stringify(redisItem))
        }
    }
})

test.serial('POST / cannot checkout with limited stock product', async t => {
    if (process.env.NODE_ENV == 'prod') {
        t.pass()
    } else {
        let redisItem: string
        let originalQuantity: number

        try {
            let item = await requestProduct.getInStockProduct(config.api.featuredSales, 2)
            await requestCart.addToCart(item.id, t.context['cookie'])
            await requestCart.addToCart(item.id, t.context['cookie'])
            account = await requestAccount.getAccountInfo(t.context['cookie'])

            redisItem = await accessRedis.getKey('nsId:' + item.nsId)
            originalQuantity = redisItem['quantity']

            // set quantity on Redis
            redisItem['quantity'] = 1
            await accessRedis.setValue('nsId:' + item.nsId, JSON.stringify(redisItem))

            const res = await request.post(config.api.checkout, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": account.cart,
                "method": "FREE"
            }, t.context['cookie'])

            t.deepEqual(res.statusCode, 400)
            t.deepEqual(res.body.message[0].message, 'ONLY_LIMITED_UNITS_IN_STOCK')
            t.deepEqual(res.body.message[0].values.title, item.name)
            t.deepEqual(res.body.data.cart[0].quantity, 1)
            t.deepEqual(res.body.data.cart[0].availableQuantity, 1)
        } catch (err) {
            throw err
        } finally {
            // reset quantity on Redis
            redisItem['quantity'] = originalQuantity
            await accessRedis.setValue('nsId:' + item.nsId, JSON.stringify(redisItem))
        }
    }
})

test.serial('POST / cannot checkout with sale ended product', async t => {
    if (process.env.NODE_ENV == 'prod') {
        t.pass()
    } else {
        let redisItem: string
        let originalEnd: string

        try {
            let item = await requestProduct.getInStockProductInfo(config.api.todaySales)
            await requestCart.addToCart(item.products[0].id, t.context['cookie'])
            account = await requestAccount.getAccountInfo(t.context['cookie'])

            redisItem = await accessRedis.getKey('productId:' + item.id)
            originalEnd = redisItem['event']['endDate']

            // set date on Redis
            redisItem['event']['endDate'] = '2019-02-18T01:00:00.000Z'
            await accessRedis.setValue('productId:' + item.id, JSON.stringify(redisItem))

            const res = await request.post(config.api.checkout, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": account.cart,
                "method": "FREE"
            }, t.context['cookie'])

            t.deepEqual(res.statusCode, 400)
            t.deepEqual(res.body.message[0].message, 'THE_SALE_FOR_TITLE_HAS_ENDED')
            t.deepEqual(res.body.message[0].values.title, item.title)
        } catch (err) {
            throw err
        } finally {
            // reset date on Redis
            redisItem['event']['endDate'] = originalEnd
            await accessRedis.setValue('productId:' + item.id, JSON.stringify(redisItem))
        }
    }
})

// validate voucher

test.serial('POST / cannot checkout with voucher not meeting min items', async t => {
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        used: false,
        numberOfItems: { $gte: 2 }
    })

    t.truthy(voucher)

    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])
    account = await requestAccount.getAccountInfo(t.context['cookie'])

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "COD",
        "shipping": 25000,
        "voucher": voucher._id,
        "accountCredit": account.accountCredit
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'NOT_MEET_MINIMUM_ITEMS')
    t.deepEqual(res.body.data.voucher.numberOfItems, voucher.numberOfItems)

})

test.serial('POST / cannot checkout with voucher not applied for today', async t => {
    const today = new Date().getDay()
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        used: false,
        specificDays: { $size: 1 },
        'specificDays.0': { $exists: true, $ne: today }
    })

    t.truthy(voucher)

    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])
    account = await requestAccount.getAccountInfo(t.context['cookie'])

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "COD",
        "shipping": 25000,
        "voucher": voucher._id,
        "accountCredit": account.accountCredit
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'VOUCHER_NOT_APPLY_FOR_TODAY')
    t.deepEqual(res.body.data.voucher.specificDays, voucher.specificDays)
})

test.serial('POST / cannot checkout with voucher not meeting min purchase', async t => {
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        used: false,
        binRange: { $exists: false },
        minimumPurchase: { $gt: 500000 }
    })

    t.truthy(voucher)

    item = await requestProduct.getProductWithCountry('VN', 0, 500000)
    await requestCart.addToCart(item.id, t.context['cookie'])
    account = await requestAccount.getAccountInfo(t.context['cookie'])

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "COD",
        "shipping": 25000,
        "voucher": voucher._id,
        "accountCredit": account.accountCredit
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'TOTAL_VALUE_LESS_THAN_VOUCHER_MINIMUM')
})

test.serial('POST / cannot checkout with voucher exceeding number of usage', async t => {
    if (process.env.NODE_ENV == 'prod') {
        t.pass()
    } else {
        const voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            multipleUser: true,
            numberOfUsage: 1,
            used: false
        }, customer)

        t.truthy(voucher)

        item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
        await requestCart.addToCart(item.id, t.context['cookie'])

        checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id

        await request.checkoutCod(checkoutInput, t.context['cookie'])

        item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
        await requestCart.addToCart(item.id, t.context['cookie'])
        account = await requestAccount.getAccountInfo(t.context['cookie'])

        const res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "shipping": 25000,
            "voucher": voucher._id,
            "accountCredit": account.accountCredit
        }, t.context['cookie'])

        t.deepEqual(res.statusCode, 400)
        t.deepEqual(res.body.message, 'EXCEED_TIME_OF_USAGE')
    }
})

test.serial('POST / cannot checkout with expired voucher', async t => {
    const voucher = await access.getVoucher({
        expiry: { $lt: new Date() },
        binRange: { $exists: false },
        used: false
    })

    t.truthy(voucher)

    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])
    account = await requestAccount.getAccountInfo(t.context['cookie'])

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "COD",
        "shipping": 25000,
        "voucher": voucher._id,
        "accountCredit": account.accountCredit
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'VOUCHER_OR_NOT_VALID')
})

test.serial('POST / cannot checkout with redeemed voucher', async t => {
    const voucher = await access.getVoucher({
        expiry: { $lt: new Date() },
        binRange: { $exists: false },
        used: true
    })

    t.truthy(voucher)

    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])
    account = await requestAccount.getAccountInfo(t.context['cookie'])

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "COD",
        "shipping": 25000,
        "voucher": voucher._id,
        "accountCredit": account.accountCredit
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'VOUCHER_OR_NOT_VALID')
})

test.serial('POST / cannot checkout with COD using voucher for CC', async t => {
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        binRange: { $exists: true },
        used: false,
        minimumPurchase: { $lte: item.salePrice }
    })

    t.truthy(voucher)

    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])
    account = await requestAccount.getAccountInfo(t.context['cookie'])

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "COD",
        "shipping": 25000,
        "voucher": voucher._id,
        "accountCredit": account.accountCredit
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'REQUIRES_CC_PAYMENT')
})

test.serial('POST / cannot checkout with voucher for Stripe using wrong bin range', async t => {
    if (process.env.NODE_ENV == 'prod') {
        t.pass()
    } else {
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            binRange: { $exists: true },
            used: false,
            minimumPurchase: { $lte: item.salePrice }
        })

        t.truthy(voucher)

        item = await requestProduct.getInStockProduct(config.api.internationalSales, 1)
        await requestCart.addToCart(item.id, t.context['cookie'])
        account = await requestAccount.getAccountInfo(t.context['cookie'])

        const stripeData = {
            "type": "card",
            "card[number]": "4000000000003063",
            "card[cvc]": "222",
            "card[exp_month]": "02",
            "card[exp_year]": "22",
            "key": config.stripeKey
        }
        const stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            t.context['cookie'], config.stripeBase).then(res => res.body)

        const res = await request.post(config.api.checkout, {
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
        }, t.context['cookie'])

        t.deepEqual(res.statusCode, 400)
        t.deepEqual(res.body.message, 'THIS_CC_NOT_ACCEPTABLE')
    }
})

test.serial('POST / cannot checkout with already used voucher', async t => {
    const voucher = await access.getUsedVoucher({
        expiry: { $gte: new Date() },
        binRange: { $exists: false },
        used: false,
        oncePerAccount: true
    }, customer)

    t.truthy(voucher)

    item = await requestProduct.getInStockProduct(config.api.currentSales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])
    account = await requestAccount.getAccountInfo(t.context['cookie'])

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "COD",
        "shipping": 25000,
        "voucher": voucher._id,
        "accountCredit": account.accountCredit
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'YOU_ALREADY_USED_THIS_VOUCHER')
})

test.serial('POST / cannot checkout with voucher only used for other customer', async t => {
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        used: false,
        customer: { $exists: true, $ne: customer._id }
    })

    t.truthy(voucher)

    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])
    account = await requestAccount.getAccountInfo(t.context['cookie'])

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "COD",
        "shipping": 25000,
        "voucher": voucher._id,
        "accountCredit": account.accountCredit
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'NOT_ALLOWED_TO_USE_VOUCHER')
})

// validate account credit

test.serial('POST / cannot checkout with more than available credit', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])
    account = await requestAccount.getAccountInfo(t.context['cookie'])

    const res = await request.post(config.api.checkout, {
        "address": {
            "shipping": addresses.shipping[0],
            "billing": addresses.billing[0]
        },
        "cart": account.cart,
        "method": "COD",
        "shipping": 25000,
        "accountCredit": account.accountCredit + 1
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'USER_SPEND_MORE_CREDIT_THAN_THEY_HAVE')
})