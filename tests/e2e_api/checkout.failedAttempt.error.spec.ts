import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as Model from '../../common/interface'
let account: Model.Account
let customer: Model.Customer
let addresses: Model.Addresses
let item: Model.Product
let failedAttemptOrder: Model.FailedAttempt
let cookie: string
const stripe = require('stripe')(config.stripeKey)

describe('Checkout API - Failed Attempt - Error ' + config.baseUrl + config.api.checkout, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
        customer = await access.getCustomerInfo({ email: account.email })
        item = await request.getInStockProduct(config.api.featuredSales, 1)
        failedAttemptOrder = await request.createFailedAttemptOrder(cookie, [item])
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    // validate required data

    test('POST / cannot recheckout with invalid email', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "COD",
                "shipping": 25000,
                "accountCredit": 0
            }, 'abc')

        expect(response.status).toEqual(400)
        expect(response.data.message).toContainEqual('EMAIL_ADDRESS_REQUIRED')
        expect(response.data.message).toContainEqual('EMAIL_ADDRESS_NOT_WELL_FORMAT')
    })

    test('POST / cannot recheckout with empty data', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {}, cookie)

        expect(response.status).toEqual(500)
    })

    test('POST / cannot recheckout without address', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": {},
                    "billing": {}
                }
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toContainEqual('SHIPPING_ADDRESS_REQUIRED')
        expect(response.data.message).toContainEqual('BILLING_ADDRESS_REQUIRED')
    })

    test('POST / cannot recheckout with empty cart', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": []
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toContainEqual('THERE_ARE_NO_ITEMS_IN_YOUR_ORDER')
    })

    test('POST / cannot recheckout with invalid phone and tax code', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": {
                        "phone": "35955"
                    },
                    "billing": {
                        "taxCode": "97436",
                        "phone": "4353"
                    }
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ]
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toContainEqual('SHIPPING_PHONE_NUMBER_IS_NOT_VALID')
        expect(response.data.message).toContainEqual('BILLING_PHONE_NUMBER_IS_NOT_VALID')
        expect(response.data.message).toContainEqual('INVALID_BILLING_TAX_CODE')
    })

    test('POST / cannot recheckout without payment method', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ]
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toContainEqual('PLEASE_SELECT_A_PAYMENT_METHOD')
    })

    // validate cart

    test('POST / cannot recheckout with mismatched cart', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    },
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "FREE"
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('CART_MISMATCH')
    })

    test('POST / cannot recheckout with mismatched quantity', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity + 1,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "FREE"
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message[0].message).toEqual('QUANTITY_SUBMITTED_NOT_MATCH_IN_THE_CART')
    })

    test('POST / cannot recheckout with mismatched price', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice - 1
                    }
                ],
                "method": "FREE"
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message[0].message).toEqual('PRICE_MISMATCH')
    })

    test('POST / cannot recheckout with invalid product', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": 'INVALID-ID',
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "FREE"
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message[0].message).toEqual('CART_MISMATCH_CANT_FIND_PRODUCT')
    })

    // validate address

    test.skip('POST / cannot recheckout with new address', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[1],
                    "billing": addresses.billing[1]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "FREE"
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message[0].message).toEqual('CART_MISMATCH_CANT_FIND_PRODUCT')
    }) // wait for WWW-401

    // validate voucher

    test('POST / cannot recheckout with voucher not meeting min items', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $gte: 2 }
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "COD",
                "shipping": 25000,
                "voucher": voucher._id
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('NOT_MEET_MINIMUM_ITEMS')
        expect(response.data.data.voucher.numberOfItems).toEqual(voucher.numberOfItems)
    })

    test('POST / cannot recheckout with voucher not applied for today', async () => {
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

        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "COD",
                "shipping": 25000,
                "voucher": voucher._id
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('VOUCHER_NOT_APPLY_FOR_TODAY')
        expect(response.data.data.voucher.specificDays).toEqual(voucher.specificDays)
    })

    test('POST / cannot recheckout with voucher not meeting min purchase', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: { $exists: false },
            minimumPurchase: { $gte: failedAttemptOrder.products[0].salePrice }
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "COD",
                "shipping": 25000,
                "voucher": voucher._id
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('TOTAL_VALUE_LESS_THAN_VOUCHER_MINIMUM')
    })

    test('POST / cannot recheckout with voucher exceeding number of usage', async () => {
        let vouchers = await access.getVoucherList({
            expiry: { $gte: new Date() },
            multipleUser: true,
            numberOfUsage: { $gte: 1 },
            used: false
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

        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "COD",
                "shipping": 25000,
                "voucher": matchedVoucher._id
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('EXCEED_TIME_OF_USAGE')
    })

    test('POST / cannot recheckout with expired voucher', async () => {
        let voucher = await access.getVoucher({
            expiry: { $lt: new Date() },
            binRange: { $exists: false },
            used: false
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "COD",
                "shipping": 25000,
                "voucher": voucher._id
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('VOUCHER_OR_NOT_VALID')
    })

    test('POST / cannot recheckout with COD using voucher for CC', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            binRange: { $exists: true },
            used: false,
            minimumPurchase: { $lte: failedAttemptOrder.products[0].salePrice }
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "COD",
                "shipping": 25000,
                "voucher": voucher._id
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('REQUIRES_CC_PAYMENT')
    })

    test('POST / cannot recheckout with voucher for Stripe using wrong bin range', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            binRange: { $exists: true },
            used: false,
            minimumPurchase: { $lte: failedAttemptOrder.products[0].salePrice }
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

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

        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "STRIPE",
                "methodData": stripeSource,
                "shipping": 0,
                "voucher": voucher._id
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('THIS_CC_NOT_ACCEPTABLE')
    })

    test('POST / cannot recheckout with already used voucher', async () => {
        let voucher = await access.getUsedVoucher({
            expiry: { $gte: new Date() },
            binRange: { $exists: false },
            used: false,
            oncePerAccount: true
        }, customer)

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "COD",
                "shipping": 25000,
                "voucher": voucher._id
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('YOU_ALREADY_USED_THIS_VOUCHER')
    })

    test('POST / cannot recheckout with voucher only used for other customer', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: { $exists: false },
            customer: { $exists: true, $ne: customer._id }
        })

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "COD",
                "shipping": 25000,
                "voucher": voucher._id
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('NOT_ALLOWED_TO_USE_VOUCHER')
    })

    // validate account credit

    test('POST / cannot recheckout with with more than available credit', async () => {
        let response = await request.post(config.api.checkout + '/order/' +
            failedAttemptOrder.code, {
                "address": {
                    "shipping": addresses.shipping[0],
                    "billing": addresses.billing[0]
                },
                "cart": [
                    {
                        "id": failedAttemptOrder.products[0].id,
                        "quantity": failedAttemptOrder.products[0].quantity,
                        "salePrice": failedAttemptOrder.products[0].salePrice
                    }
                ],
                "method": "COD",
                "shipping": 25000,
                "accountCredit": account.accountCredit + 1
            }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('USER_SPEND_MORE_CREDIT_THAN_THEY_HAVE')
    })
})