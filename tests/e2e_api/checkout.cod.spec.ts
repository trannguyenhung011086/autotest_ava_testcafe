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

describe('Checkout API - Logged in - COD ' + config.baseUrl + config.api.checkout, () => {
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
        let item2 = await request.getInStockProduct(config.api.todaySales, 1)
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
        item = await request.getInStockProduct(config.api.todaySales, 1)

        let checkout = await request.createCodOrder(cookie, [item])
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
    })

    test('POST / checkout with COD - voucher (amount) + credit', async () => {
        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            used: false,
            discountType: 'amount',
            minimumPurchase: 0,
            numberOfItems: 0,
            oncePerAccount: true
        }, customer)

        item = await request.getInStockProduct(config.api.todaySales, 1)

        let credit: number
        if (account.accountCredit < (item.salePrice + 25000 - voucher.amount)) {
            credit = account.accountCredit
        } else if (account.accountCredit >= (item.salePrice + 25000 - voucher.amount)) {
            credit = item.salePrice + 25000 - voucher.amount
        }

        let checkout = await request.createCodOrder(cookie, [item], voucher._id, credit)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
        expect(order.paymentSummary.voucherAmount).toEqual(voucher.amount)
        expect(Math.abs(order.paymentSummary.accountCredit)).toEqual(credit)
    })

    test('POST / checkout with COD - voucher (percentage + max discount)', async () => {
        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $exists: false },
            minimumPurchase: { $lte: 500000 },
            binRange: { $exists: false },
            discountType: 'percentage',
            maximumDiscountAmount: { $gt: 0 },
            specificDays: []
        }, customer)

        item = await request.getInStockProduct(config.api.todaySales, 1, 500000)

        let checkout = await request.createCodOrder(cookie, [item], voucher._id)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
        expect(order.paymentSummary.voucherAmount).toBeLessThanOrEqual(voucher.maximumDiscountAmount)
    })
})