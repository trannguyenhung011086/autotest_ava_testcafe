import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let account: Model.Account
let customer: Model.Customer
let addresses: Model.Addresses
let cookie: string
let checkoutInput: Model.CheckoutInput

let request = new Utils.CheckoutUtils
let requestAddress = new Utils.AddressUtils
let requestAccount = new Utils.AccountUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils
let requestOrder = new Utils.OrderUtils
let access = new Utils.DbAccessUtils

const stripeData = {
    "card[number]": "5555555555554444",
    "type": "card",
    "card[cvc]": "222",
    "card[exp_month]": "02",
    "card[exp_year]": "22",
    "key": config.stripeKey
}

let stripeSource: any

export const CheckoutSplitTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
        await requestAddress.addAddresses(cookie)
        addresses = await requestAddress.getAddresses(cookie)
        account = await requestAccount.getAccountInfo(cookie)
        customer = await access.getCustomerInfo({ email: account.email })
        stripeSource = await request.postFormUrl('/v1/sources', stripeData,
            cookie, config.stripeBase).then(res => res.body)
        checkoutInput = {}
        jest.setTimeout(150000)
    })

    afterEach(async () => {
        await requestCart.emptyCart(cookie)
    })

    afterAll(async () => {
        await requestAddress.deleteAddresses(cookie)
    })

    it('POST / not split SG order when total < 1,000,000', async () => {
        let itemSG1 = await requestProduct.getProductWithCountry('SG', 0, 400000)
        let itemSG2 = await requestProduct.getProductWithCountry('SG', 400000, 500000)

        await requestCart.addToCart(itemSG1.id, cookie)
        await requestCart.addToCart(itemSG2.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = stripeSource

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        let order = await requestOrder.getOrderInfo(checkout.code, cookie)

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

    it.skip('POST / not split HK order when total < 1,000,000', async () => {
        // skip due to not have HK stock now
        let itemHK1 = await requestProduct.getProductWithCountry('HK', 0, 400000)
        let itemHK2 = await requestProduct.getProductWithCountry('HK', 400000, 500000)

        await requestCart.addToCart(itemHK1.id, cookie)
        await requestCart.addToCart(itemHK2.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = stripeSource

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        let order = await requestOrder.getOrderInfo(checkout.code, cookie)

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

    it('POST / split SG order when total >= 1,000,000', async () => {
        let itemSG1 = await requestProduct.getProductWithCountry('SG', 0, 800000)
        let itemSG2 = await requestProduct.getProductWithCountry('SG', 900000, 2000000)

        await requestCart.addToCart(itemSG1.id, cookie)
        await requestCart.addToCart(itemSG2.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = stripeSource

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        let orders = await requestOrder.getSplitOrderInfo(checkout.code, cookie)

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

    it.skip('POST / split HK order when total >= 1,000,000', async () => {
        // skip due to not have HK stock now
        let itemHK1 = await requestProduct.getProductWithCountry('HK', 0, 800000)
        let itemHK2 = await requestProduct.getProductWithCountry('HK', 900000, 2000000)

        await requestCart.addToCart(itemHK1.id, cookie)
        await requestCart.addToCart(itemHK2.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = stripeSource

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        let orders = await requestOrder.getSplitOrderInfo(checkout.code, cookie)

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

    it('POST / split SG and VN order', async () => {
        let itemSG = await requestProduct.getProductWithCountry('SG', 0, 2000000)
        let itemVN = await requestProduct.getProductWithCountry('VN', 0, 2000000)

        await requestCart.addToCart(itemSG.id, cookie)
        await requestCart.addToCart(itemVN.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = stripeSource

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        let orders = await requestOrder.getSplitOrderInfo(checkout.code, cookie)

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

    it.skip('POST / split HK and VN order', async () => {
        // skip due to not have HK stock now
        let itemHK = await requestProduct.getProductWithCountry('HK', 0, 2000000)
        let itemVN = await requestProduct.getProductWithCountry('VN', 0, 2000000)

        await requestCart.addToCart(itemHK.id, cookie)
        await requestCart.addToCart(itemVN.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = stripeSource

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        let orders = await requestOrder.getSplitOrderInfo(checkout.code, cookie)

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

    it('POST / split multiple SG and VN order', async () => {
        let itemSG1 = await requestProduct.getProductWithCountry('SG', 0, 800000)
        let itemSG2 = await requestProduct.getProductWithCountry('SG', 900000, 2000000)
        let itemVN1 = await requestProduct.getProductWithCountry('VN', 0, 800000)
        let itemVN2 = await requestProduct.getProductWithCountry('VN', 1000000, 2000000)

        await requestCart.addToCart(itemSG1.id, cookie)
        await requestCart.addToCart(itemSG2.id, cookie)
        await requestCart.addToCart(itemVN1.id, cookie)
        await requestCart.addToCart(itemVN2.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = stripeSource

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        let orders = await requestOrder.getSplitOrderInfo(checkout.code, cookie)

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

    it.skip('POST / split multiple HK and VN order', async () => {
        // skip due to not have HK stock now
        let itemHK1 = await requestProduct.getProductWithCountry('HK', 0, 800000)
        let itemHK2 = await requestProduct.getProductWithCountry('HK', 900000, 2000000)
        let itemVN1 = await requestProduct.getProductWithCountry('VN', 0, 800000)
        let itemVN2 = await requestProduct.getProductWithCountry('VN', 900000, 2000000)

        await requestCart.addToCart(itemHK1.id, cookie)
        await requestCart.addToCart(itemHK2.id, cookie)
        await requestCart.addToCart(itemVN1.id, cookie)
        await requestCart.addToCart(itemVN2.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = stripeSource

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        let orders = await requestOrder.getSplitOrderInfo(checkout.code, cookie)

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

    it.skip('POST / split SG, HK and VN order', async () => {
        // skip due to not have HK stock now
        let itemSG = await requestProduct.getProductWithCountry('SG', 0, 2000000)
        let itemHK = await requestProduct.getProductWithCountry('HK', 0, 2000000)
        let itemVN = await requestProduct.getProductWithCountry('VN', 0, 2000000)

        await requestCart.addToCart(itemSG.id, cookie)
        await requestCart.addToCart(itemHK.id, cookie)
        await requestCart.addToCart(itemVN.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = stripeSource

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        let orders = await requestOrder.getSplitOrderInfo(checkout.code, cookie)

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

    it('POST / split SG and VN order - voucher (amount)', async () => {
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

        let itemSG = await requestProduct.getProductWithCountry('SG', 0, 2000000)
        let itemVN = await requestProduct.getProductWithCountry('VN', 0, 2000000)

        await requestCart.addToCart(itemSG.id, cookie)
        await requestCart.addToCart(itemVN.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = stripeSource

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        let orders = await requestOrder.getSplitOrderInfo(checkout.code, cookie)

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

    it('POST / split SG order when total >= 1,000,000 - voucher (percentage + max discount)', async () => {
        let voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: '433590,542288,555555,400000',
            discountType: 'percentage',
            maximumDiscountAmount: { $gt: 0 },
            specificDays: []
        })

        let itemSG1 = await requestProduct.getProductWithCountry('SG', 500000, 700000)
        let itemSG2 = await requestProduct.getProductWithCountry('SG', 800000, 2000000)
        let itemSG3 = await requestProduct.getProductWithCountry('SG', 2100000, 2000000)

        await requestCart.addToCart(itemSG1.id, cookie)
        await requestCart.addToCart(itemSG2.id, cookie)
        await requestCart.addToCart(itemSG3.id, cookie)

        checkoutInput.account = await requestAccount.getAccountInfo(cookie)
        checkoutInput.addresses = addresses
        checkoutInput.voucherId = voucher._id
        checkoutInput.saveNewCard = false
        checkoutInput.stripeSource = stripeSource

        let checkout = await request.checkoutStripe(checkoutInput, cookie)
        let orders = await requestOrder.getSplitOrderInfo(checkout.code, cookie)

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
}

describe('Checkout API - Split order (skip-prod) ' + config.baseUrl +
    config.api.checkout, CheckoutSplitTest)