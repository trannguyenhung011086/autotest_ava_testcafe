import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as Model from '../../../common/interface'
let account: Model.Account
let customer: Model.Customer
let item: Model.Product
let addresses: Model.Addresses
let checkoutInput: Model.CheckoutInput
let cookie: string

export const CheckoutCodTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        await request.addAddresses(cookie)
        addresses = await request.getAddresses(cookie)
        account = await request.getAccountInfo(cookie)
        customer = await access.getCustomerInfo({ email: account.email })
        checkoutInput = {}
    })

    afterEach(async () => {
        await request.emptyCart(cookie)
    })

    afterAll(async () => {
        await request.deleteAddresses(cookie)
    })

    it('POST / cannot checkout with COD - international product', async () => {
        item = await request.getInStockProduct(config.api.internationalSales, 1)

        await request.addToCart(item.id, cookie)
        account = await request.getAccountInfo(cookie)

        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD"
        }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('International orders must be paid by credit card. Please refresh the page and try again.')
    })

    it('POST / cannot checkout with COD - domestic + international product', async () => {
        let item1 = await request.getInStockProduct(config.api.internationalSales, 1)
        let item2 = await request.getInStockProduct(config.api.todaySales, 1)

        await request.addToCart(item1.id, cookie)
        await request.addToCart(item2.id, cookie)

        account = await request.getAccountInfo(cookie)

        let res = await request.post(config.api.checkout, {
            "address": {
                "shipping": addresses.shipping[0],
                "billing": addresses.billing[0]
            },
            "cart": account.cart,
            "method": "COD"
        }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('International orders must be paid by credit card. Please refresh the page and try again.')
    })

    it('POST / checkout with COD', async () => {
        item = await request.getInStockProduct(config.api.todaySales, 1)
        await request.addToCart(item.id, cookie)

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses

        let checkout = await request.checkoutCod(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)

        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
    })

    it('POST / checkout with COD - voucher (amount) + credit (skip-prod)', async () => {
        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            used: false,
            discountType: 'amount',
            minimumPurchase: 0,
            numberOfItems: 0,
            oncePerAccount: true
        }, customer)

        item = await request.getInStockProduct(config.api.todaySales, 2)
        await request.addToCart(item.id, cookie)

        let credit: number
        if (account.accountCredit < (item.salePrice + 25000 - voucher.amount)) {
            credit = account.accountCredit
        } else if (account.accountCredit >= (item.salePrice + 25000 - voucher.amount)) {
            credit = item.salePrice + 25000 - voucher.amount
        }

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id
        checkoutInput.credit = credit

        let checkout = await request.checkoutCod(checkoutInput, cookie)
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

    it('POST / checkout with COD - voucher (percentage + max discount) (skip-prod)', async () => {
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
        await request.addToCart(item.id, cookie)

        checkoutInput.account = await request.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id

        let checkout = await request.checkoutCod(checkoutInput, cookie)
        expect(checkout.orderId).not.toBeEmpty()

        let order = await request.getOrderInfo(checkout.orderId, cookie)
        expect(order.code).toInclude(checkout.code)
        expect(order.status).toEqual('placed')
        expect(order.isCrossBorder).toBeFalse()
        expect(order.paymentSummary.method).toEqual('COD')
        expect(order.paymentSummary.shipping).toEqual(25000)
        expect(order.paymentSummary.voucherAmount).toBeLessThanOrEqual(voucher.maximumDiscountAmount)
    })
}

describe('Checkout API - Logged in - COD ' + config.baseUrl + config.api.checkout, CheckoutCodTest)