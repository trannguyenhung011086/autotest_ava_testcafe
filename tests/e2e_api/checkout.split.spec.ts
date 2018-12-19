import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as Model from '../../common/interface'
let account: Model.Account
let customer: Model.Customer
let cookie: string
const stripe = require('stripe')(config.stripeKey)

const stripeData = {
    "card[number]": "5555555555554444",
    "type": "card",
    "card[cvc]": "222",
    "card[exp_month]": "02",
    "card[exp_year]": "22",
    "guid": "4f3cf4ad-6d10-4ec1-8eaf-7ef50bb46c16",
    "muid": "a12e310c-5dab-4ac0-a582-6c19685db4fe",
    "sid": "d2039514-f249-4a07-9a6a-9a6de9d7f28c",
    "pasted_fields": "number",
    "payment_user_agent": "stripe.js/f59e6fc3; stripe-js-v3/f59e6fc3",
    "referrer": "https://secure.staging.leflair.io/checkout?language=vn",
    "key": config.stripeKey
}

describe('Checkout API - Split order ' + config.baseUrl + config.api.checkout, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        account = await request.getAccountInfo(cookie)
        customer = await access.getCustomerInfo({ email: account.email })
        jest.setTimeout(150000)
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    test('POST / not split SG order when total < 1,000,000', async () => {
        let itemSG1 = await request.getProductWithPrice('SG', 0, 400000, 1)
        let itemSG2 = await request.getProductWithPrice('SG', 400000, 500000, 1)

        let stripeSource = await stripe.sources.create(stripeData)
        let checkout = await request.createStripeOrder(cookie, [itemSG1, itemSG2],
            stripeSource, true)
        let order = await request.getOrderInfo(checkout.code, cookie)

        expect(order).not.toBeArray()
        expect(order.code).toEqual(`SGVN-${checkout.code}-1`)
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')

        for (let product of order.products) {
            if (product.productId == itemSG1.id) {
                expect(product.salePrice).toEqual(itemSG1.salePrice)
            }
            if (product.productId == itemSG2.id) {
                expect(product.salePrice).toEqual(itemSG2.salePrice)
            }
        }
    })

    test('POST / not split HK order when total < 1,000,000', async () => {
        let itemHK1 = await request.getProductWithPrice('HK', 0, 400000, 1)
        let itemHK2 = await request.getProductWithPrice('HK', 400000, 500000, 1)

        let stripeSource = await stripe.sources.create(stripeData)
        let checkout = await request.createStripeOrder(cookie, [itemHK1, itemHK2],
            stripeSource, true)
        let order = await request.getOrderInfo(checkout.code, cookie)

        expect(order).not.toBeArray()
        expect(order.code).toEqual(`SGVN-${checkout.code}-1`)
        expect(order.isCrossBorder).toBeTrue()
        expect(order.paymentSummary.method).toEqual('STRIPE')

        for (let product of order.products) {
            if (product.productId == itemHK1.id) {
                expect(product.salePrice).toEqual(itemHK1.salePrice)
            }
            if (product.productId == itemHK2.id) {
                expect(product.salePrice).toEqual(itemHK2.salePrice)
            }
        }
    })

    test('POST / split SG order when total >= 1,000,000', async () => {
        let itemSG1 = await request.getProductWithPrice('SG', 300000, 400000, 1)
        let itemSG2 = await request.getProductWithPrice('SG', 800000, 2000000, 1)

        let stripeSource = await stripe.sources.create(stripeData)
        let checkout = await request.createStripeOrder(cookie, [itemSG1, itemSG2],
            stripeSource, true)
        let orders = await request.getSplitOrderInfo(checkout.code, cookie)

        expect(orders).toBeArrayOfSize(2)
        for (let order of orders) {
            if (order.products[0].productId == itemSG1.id) {
                expect(order.products[0].salePrice).toEqual(itemSG1.salePrice)
                expect(order.paymentSummary.total).toEqual(itemSG1.salePrice)
            }
            if (order.products[0].productId == itemSG2.id) {
                expect(order.products[0].salePrice).toEqual(itemSG2.salePrice)
                expect(order.paymentSummary.total).toEqual(itemSG2.salePrice)
            }
            expect(order.code).toInclude(checkout.code)
            expect(order.code).toMatch(/SGVN-.+-\d/)
            expect(order.isCrossBorder).toBeTrue()
            expect(order.paymentSummary.method).toEqual('STRIPE')
        }
    })

    test('POST / split HK order when total >= 1,000,000', async () => {
        let itemHK1 = await request.getProductWithPrice('HK', 300000, 400000, 1)
        let itemHK2 = await request.getProductWithPrice('HK', 800000, 2000000, 1)

        let stripeSource = await stripe.sources.create(stripeData)
        let checkout = await request.createStripeOrder(cookie, [itemHK1, itemHK2],
            stripeSource, true)
        let orders = await request.getSplitOrderInfo(checkout.code, cookie)

        expect(orders).toBeArrayOfSize(2)
        for (let order of orders) {
            if (order.products[0].productId == itemHK1.id) {
                expect(order.products[0].salePrice).toEqual(itemHK1.salePrice)
                expect(order.paymentSummary.total).toEqual(itemHK1.salePrice)
            }
            if (order.products[0].productId == itemHK2.id) {
                expect(order.products[0].salePrice).toEqual(itemHK2.salePrice)
                expect(order.paymentSummary.total).toEqual(itemHK2.salePrice)
            }
            expect(order.code).toInclude(checkout.code)
            expect(order.code).toMatch(/HKVN-.+-\d/)
            expect(order.isCrossBorder).toBeTrue()
            expect(order.paymentSummary.method).toEqual('STRIPE')
        }
    })

    test('POST / split SG and VN order', async () => {
        let itemSG = await request.getProductWithPrice('SG', 0, 2000000, 1)
        let itemVN = await request.getInStockProduct(config.api.todaySales, 1, 300000)

        let stripeSource = await stripe.sources.create(stripeData)
        let checkout = await request.createStripeOrder(cookie, [itemSG, itemVN],
            stripeSource, true)
        let orders = await request.getSplitOrderInfo(checkout.code, cookie)

        expect(orders).toBeArrayOfSize(2)
        for (let order of orders) {
            if (order.products[0].productId == itemSG.id) {
                expect(order.code).toEqual(`SGVN-${checkout.code}-1`)
                expect(order.isCrossBorder).toBeTrue()
                expect(order.products[0].salePrice).toEqual(itemSG.salePrice)
                expect(order.paymentSummary.total).toEqual(itemSG.salePrice)
            }
            if (order.products[0].productId == itemVN.id) {
                expect(order.code).toEqual(`VN-${checkout.code}`)
                expect(order.isCrossBorder).toBeFalse()
                expect(order.products[0].salePrice).toEqual(itemVN.salePrice)
                expect(order.paymentSummary.total).toEqual(itemVN.salePrice)
            }
            expect(order.paymentSummary.method).toEqual('STRIPE')
        }
    })

    test('POST / split HK and VN order', async () => {
        let itemHK = await request.getProductWithPrice('HK', 0, 2000000, 1)
        let itemVN = await request.getInStockProduct(config.api.todaySales, 1, 300000)

        let stripeSource = await stripe.sources.create(stripeData)
        let checkout = await request.createStripeOrder(cookie, [itemHK, itemVN],
            stripeSource, true)
        let orders = await request.getSplitOrderInfo(checkout.code, cookie)

        expect(orders).toBeArrayOfSize(2)
        for (let order of orders) {
            if (order.products[0].productId == itemHK.id) {
                expect(order.code).toEqual(`HKVN-${checkout.code}-1`)
                expect(order.isCrossBorder).toBeTrue()
                expect(order.products[0].salePrice).toEqual(itemHK.salePrice)
                expect(order.paymentSummary.total).toEqual(itemHK.salePrice)
            }
            if (order.products[0].productId == itemVN.id) {
                expect(order.code).toEqual(`VN-${checkout.code}`)
                expect(order.isCrossBorder).toBeFalse()
                expect(order.products[0].salePrice).toEqual(itemVN.salePrice)
                expect(order.paymentSummary.total).toEqual(itemVN.salePrice)
            }
            expect(order.paymentSummary.method).toEqual('STRIPE')
        }
    })

    test('POST / split multiple SG and VN order', async () => {
        let itemSG1 = await request.getProductWithPrice('SG', 300000, 400000, 1)
        let itemSG2 = await request.getProductWithPrice('SG', 800000, 2000000, 1)
        let itemVN1 = await request.getInStockProduct(config.api.todaySales, 1, 300000)
        let itemVN2 = await request.getInStockProduct(config.api.featuredSales, 1, 300000)

        let stripeSource = await stripe.sources.create(stripeData)
        let checkout = await request.createStripeOrder(cookie, [itemSG1, itemSG2, itemVN1, itemVN2],
            stripeSource, true)
        let orders = await request.getSplitOrderInfo(checkout.code, cookie)

        expect(orders).toBeArrayOfSize(3)
        for (let order of orders) {
            if (order.products[0].productId == itemSG1.id) {
                expect(order.code).toMatch(/SGVN-.+-\d/)
                expect(order.isCrossBorder).toBeTrue()
                expect(order.products[0].salePrice).toEqual(itemSG1.salePrice)
                expect(order.paymentSummary.total).toEqual(itemSG1.salePrice)
            }
            if (order.products[0].productId == itemSG2.id) {
                expect(order.code).toMatch(/SGVN-.+-\d/)
                expect(order.isCrossBorder).toBeTrue()
                expect(order.products[0].salePrice).toEqual(itemSG2.salePrice)
                expect(order.paymentSummary.total).toEqual(itemSG2.salePrice)
            }
            if (order.products[0].productId == itemVN1.id || order.products[0].productId == itemVN2.id) {
                expect(order.code).toEqual(`VN-${checkout.code}`)
                expect(order.isCrossBorder).toBeFalse()
            }
            expect(order.code).toInclude(checkout.code)
            expect(order.paymentSummary.method).toEqual('STRIPE')
        }
    })

    test('POST / split multiple HK and VN order', async () => {
        let itemHK1 = await request.getProductWithPrice('HK', 300000, 400000, 1)
        let itemHK2 = await request.getProductWithPrice('HK', 800000, 2000000, 1)
        let itemVN1 = await request.getInStockProduct(config.api.todaySales, 1, 300000)
        let itemVN2 = await request.getInStockProduct(config.api.featuredSales, 1, 300000)

        let stripeSource = await stripe.sources.create(stripeData)
        let checkout = await request.createStripeOrder(cookie, [itemHK1, itemHK2, itemVN1, itemVN2],
            stripeSource, true)
        let orders = await request.getSplitOrderInfo(checkout.code, cookie)

        expect(orders).toBeArrayOfSize(3)
        for (let order of orders) {
            if (order.products[0].productId == itemHK1.id) {
                expect(order.code).toMatch(/HKVN-.+-\d/)
                expect(order.isCrossBorder).toBeTrue()
                expect(order.products[0].salePrice).toEqual(itemHK1.salePrice)
                expect(order.paymentSummary.total).toEqual(itemHK1.salePrice)
            }
            if (order.products[0].productId == itemHK2.id) {
                expect(order.code).toMatch(/HKVN-.+-\d/)
                expect(order.isCrossBorder).toBeTrue()
                expect(order.products[0].salePrice).toEqual(itemHK2.salePrice)
                expect(order.paymentSummary.total).toEqual(itemHK2.salePrice)
            }
            if (order.products[0].productId == itemVN1.id || order.products[0].productId == itemVN2.id) {
                expect(order.code).toEqual(`VN-${checkout.code}`)
                expect(order.isCrossBorder).toBeFalse()
            }
            expect(order.code).toInclude(checkout.code)
            expect(order.paymentSummary.method).toEqual('STRIPE')
        }
    })

    test('POST / split SG, HK and VN order', async () => {
        let itemSG = await request.getProductWithPrice('SG', 0, 2000000, 1)
        let itemHK = await request.getProductWithPrice('HK', 0, 6000000, 1)
        let itemVN = await request.getInStockProduct(config.api.todaySales, 1, 300000)

        let stripeSource = await stripe.sources.create(stripeData)
        let checkout = await request.createStripeOrder(cookie, [itemSG, itemHK, itemVN],
            stripeSource, true)
        let orders = await request.getSplitOrderInfo(checkout.code, cookie)

        expect(orders).toBeArrayOfSize(3)
        for (let order of orders) {
            if (order.products[0].productId == itemSG.id) {
                expect(order.code).toEqual(`SGVN-${checkout.code}-1`)
                expect(order.isCrossBorder).toBeTrue()
                expect(order.products[0].salePrice).toEqual(itemSG.salePrice)
                expect(order.paymentSummary.total).toEqual(itemSG.salePrice)
            }
            if (order.products[0].productId == itemHK.id) {
                expect(order.code).toEqual(`HKVN-${checkout.code}-1`)
                expect(order.isCrossBorder).toBeTrue()
                expect(order.products[0].salePrice).toEqual(itemHK.salePrice)
                expect(order.paymentSummary.total).toEqual(itemHK.salePrice)
            }
            if (order.products[0].productId == itemVN.id) {
                expect(order.code).toEqual(`VN-${checkout.code}`)
                expect(order.isCrossBorder).toBeFalse()
                expect(order.products[0].salePrice).toEqual(itemVN.salePrice)
                expect(order.paymentSummary.total).toEqual(itemVN.salePrice)
            }
            expect(order.paymentSummary.method).toEqual('STRIPE')
        }
    })

    test('POST / split SG and VN order - voucher (amount)', async () => {
        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $exists: false },
            minimumPurchase: null,
            binRange: { $exists: false },
            discountType: 'amount',
            amount: { $gt: 0 },
            specificDays: []
        }, customer)

        let itemSG = await request.getProductWithPrice('SG', 0, 2000000, 1)
        let itemVN = await request.getInStockProduct(config.api.todaySales, 1, 300000)

        let stripeSource = await stripe.sources.create(stripeData)
        let checkout = await request.createStripeOrder(cookie, [itemSG, itemVN],
            stripeSource, true, voucher._id)
        let orders = await request.getSplitOrderInfo(checkout.code, cookie)

        expect(orders).toBeArrayOfSize(2)
        for (let order of orders) {
            if (order.products[0].productId == itemSG.id) {
                expect(order.code).toEqual(`SGVN-${checkout.code}-1`)
                expect(order.isCrossBorder).toBeTrue()
                expect(order.products[0].salePrice).toEqual(itemSG.salePrice)
            }
            if (order.products[0].productId == itemVN.id) {
                expect(order.code).toEqual(`VN-${checkout.code}`)
                expect(order.isCrossBorder).toBeFalse()
                expect(order.products[0].salePrice).toEqual(itemVN.salePrice)
            }
            expect(order.paymentSummary.method).toEqual('STRIPE')
        }
        expect(orders[0].paymentSummary.voucherAmount +
            orders[1].paymentSummary.voucherAmount).toEqual(voucher.amount)
    })

    test('POST / split SG order when total >= 1,000,000 - voucher (percentage + max discount)', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: '433590,542288,555555,400000',
            discountType: 'percentage',
            maximumDiscountAmount: { $gt: 0 },
            specificDays: []
        })

        let itemSG1 = await request.getProductWithPrice('SG', 500000, 2000000, 1)
        let itemSG2 = await request.getProductWithPrice('SG', 800000, 2000000, 1)
        let itemSG3 = await request.getProductWithPrice('SG', 1000000, 2000000, 1)

        let stripeSource = await stripe.sources.create(stripeData)
        let checkout = await request.createStripeOrder(cookie, [itemSG1, itemSG2, itemSG3],
            stripeSource, true, voucher._id)
        let orders = await request.getSplitOrderInfo(checkout.code, cookie)

        expect(orders).toBeArrayOfSize(3)
        for (let order of orders) {
            if (order.products[0].productId == itemSG1.id) {
                expect(order.products[0].salePrice).toEqual(itemSG1.salePrice)
            }
            if (order.products[0].productId == itemSG2.id) {
                expect(order.products[0].salePrice).toEqual(itemSG2.salePrice)
            }
            if (order.products[0].productId == itemSG3.id) {
                expect(order.products[0].salePrice).toEqual(itemSG3.salePrice)
            }
            expect(order.code).toInclude(checkout.code)
            expect(order.code).toMatch(/SGVN-.+-\d/)
            expect(order.isCrossBorder).toBeTrue()
            expect(order.paymentSummary.method).toEqual('STRIPE')
        }
        expect(orders[0].paymentSummary.voucherAmount +
            orders[1].paymentSummary.voucherAmount +
            orders[2].paymentSummary.voucherAmount).toBeLessThanOrEqual(voucher.maximumDiscountAmount)
    })
})