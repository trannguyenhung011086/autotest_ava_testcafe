import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as Model from '../../common/interface'
let account: Model.Account
let customer: Model.Customer
let item: Model.Product
let addresses: Model.Addresses
let cookie: string

describe('Checkout API - Logged in - COD ' + config.baseUrl + config.api.cart, () => {
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

    test('POST / cannot checkout with COD - international product', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD"
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('International orders must be paid by credit card. Please refresh the page and try again.')
    })

    test('POST / cannot checkout with COD - domestic + international product', async () => {
        let item1 = await request.getInStockProduct(config.api.internationalSales, 1)
        let item2 = await request.getInStockProduct(config.api.featuredSales, 1)
        await request.addToCart(item1.id, cookie)
        await request.addToCart(item2.id, cookie)
        account = await request.getAccountInfo(cookie)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD"
        }, cookie)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('International orders must be paid by credit card. Please refresh the page and try again.')
    })

    test('POST / checkout with COD', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD"
        }, cookie)

        expect(response.status).toEqual(200)
        expect(response.data.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(response.data.orderId, cookie)
        expect(order.code).toInclude(response.data.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
    })

    test('POST / checkout with COD - voucher (amount)', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $exists: false },
            minimumPurchase: { $lte: item.salePrice },
            binRange: { $exists: false },
            discountType: 'amount',
            amount: { $gt: 0, $lt: item.salePrice },
            specificDays: []
        }, customer)

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
            "voucher": voucher._id
        }, cookie)

        expect(response.status).toEqual(200)
        expect(response.data.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(response.data.orderId, cookie)
        expect(order.code).toInclude(response.data.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
        expect(order.paymentSummary.voucherAmount).toEqual(voucher.amount)
    })

    test('POST / checkout with COD - voucher (amount) + credit', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $exists: false },
            minimumPurchase: { $lte: item.salePrice },
            binRange: { $exists: false },
            discountType: 'amount',
            amount: { $gt: 0, $lt: item.salePrice },
            specificDays: []
        }, customer)

        if (!voucher) {
            throw new Error('No voucher found for this test!')
        }

        let credit: number
        if (account.accountCredit < item.salePrice) {
            credit = account.accountCredit
        } else if (account.accountCredit >= item.salePrice) {
            credit = account.accountCredit - item.salePrice
        }

        let response = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD",
            "voucher": voucher._id,
            "accountCredit": credit
        }, cookie)

        expect(response.status).toEqual(200)
        expect(response.data.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(response.data.orderId, cookie)
        expect(order.code).toInclude(response.data.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
        expect(order.paymentSummary.voucherAmount).toEqual(voucher.amount)
        expect(order.paymentSummary.accountCredit).toEqual(credit)
    })

    test('POST / checkout with COD - voucher (percentage)', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $exists: false },
            minimumPurchase: { $lte: item.salePrice },
            binRange: { $exists: false },
            discountType: 'percentage',
            maximumDiscountAmount: null,
            specificDays: []
        }, customer)

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
            "voucher": voucher._id
        }, cookie)

        expect(response.status).toEqual(200)
        expect(response.data.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(response.data.orderId, cookie)
        expect(order.code).toInclude(response.data.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)

        let discount = (order.paymentSummary.subtotal + order.paymentSummary.shipping +
            order.paymentSummary.accountCredit) * voucher.amount
        expect(order.paymentSummary.voucherAmount).toEqual(discount)
    })

    test('POST / checkout with COD - voucher (percentage + max discount)', async () => {
        item = await request.getInStockProduct(config.api.featuredSales, 1)
        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $exists: false },
            minimumPurchase: { $lte: item.salePrice },
            binRange: { $exists: false },
            discountType: 'percentage',
            maximumDiscountAmount: { $gt: 0 },
            specificDays: []
        }, customer)

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
            "voucher": voucher._id
        }, cookie)

        expect(response.status).toEqual(200)
        expect(response.data.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(response.data.orderId, cookie)
        expect(order.code).toInclude(response.data.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
        expect(order.paymentSummary.voucherAmount).toBeLessThanOrEqual(voucher.maximumDiscountAmount)
    })
})