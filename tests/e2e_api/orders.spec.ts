import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as model from '../../common/interface'
let cookie: string
let account: model.Account
let orders: model.OrderSummary[]
let orderItem: model.Order
const orderStatus = ['placed', 'confirmed', 'cancelled', 'shipped', 'delivered']
const paymentMethod = ['COD', 'STRIPE', 'CC', 'FREE']
const card = ['VISA', 'Master']

describe('User orders info API ' + config.baseUrl + config.api.orders, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        account = await request.getAccountInfo()
        jest.setTimeout(120000)
    })

    test('GET / cannot see order of another customer', async () => {
        let response = await request.get(config.api.orders + '/5be3ea348f2a5c000155efbc')
        expect(response.status).toEqual(200)
        expect(response.data).toBeEmpty()
    })

    test('GET / can access orders', async () => {
        let response = await request.get(config.api.orders)
        orders = response.data
        expect(response.status).toEqual(200)
        for (let order of orders) {
            try {
                expect(order.id).not.toBeEmpty()
                expect(order.code).toMatch(/^SG|HK|VN/)
                expect(order.createdDate).toMatch(/^(\d\d\/){2}\d{4}$/)
                expect(orderStatus).toContain(order.status)
                if (order.shippedDate != null) {
                    expect(order.shippedDate).toMatch(/^(\d\d\/){2}\d{4}$/)
                }
                if (order.deliveredDate != null) {
                    expect(order.deliveredDate).toMatch(/^(\d\d\/){2}\d{4}$/)
                }
            } catch (error) {
                throw { failed_order: order, error: error }
            }
        }
    })

    test('GET / can see order info using order ID', async () => {
        orders = await request.getOrders()

        for (let order of orders) {
            try {
                let response = await request.get(config.api.orders + '/' + order.id)
                orderItem = response.data
                expect(response.status).toEqual(200)

                expect(orderItem.id).toEqual(order.id)
                expect(orderItem.code).toMatch(/^SG|HK|VN/)
                expect(orderItem.createdDate).toMatch(/^(\d\d\/){2}\d{4}$/)
                expect(orderStatus).toContain(orderItem.status)
                if (orderItem.shippedDate != null) {
                    expect(orderItem.shippedDate).toMatch(/^(\d\d\/){2}\d{4}$/)
                }
                if (orderItem.deliveredDate != null) {
                    expect(orderItem.deliveredDate).toMatch(/^(\d\d\/){2}\d{4}$/)
                }

                expect(orderItem.isBulky).toBeBoolean()
                if (orderItem.isCrossBorder != null) {
                    expect(orderItem.isCrossBorder).toBeBoolean()
                }
                expect(orderItem.isFirstOrder).toBeBoolean()
                expect(orderItem.isVirtual).toBeBoolean()

                expect(orderItem.tracking).toMatch(/dhlecommerce\.asia|ghn\.vn/)
                expect(orderItem.user).toEqual(account.id)

                expect(orderItem.address.billing.address).not.toBeEmpty()
                expect(orderItem.address.billing.city).not.toBeEmpty()
                expect(orderItem.address.billing.district).not.toBeEmpty()
                expect(orderItem.address.billing.firstName).not.toBeEmpty()
                expect(orderItem.address.billing.lastName).not.toBeEmpty()
                expect(orderItem.address.billing.phone).not.toBeEmpty()

                expect(orderItem.address.shipping.address).not.toBeEmpty()
                expect(orderItem.address.shipping.city).not.toBeEmpty()
                expect(orderItem.address.shipping.district).not.toBeEmpty()
                expect(orderItem.address.shipping.firstName).not.toBeEmpty()
                expect(orderItem.address.shipping.lastName).not.toBeEmpty()
                expect(orderItem.address.shipping.phone).not.toBeEmpty()

                expect(paymentMethod).toContain(orderItem.paymentSummary.method)
                if (orderItem.paymentSummary.method == 'COD' ||
                    orderItem.paymentSummary.method == 'STRIPE') {
                    expect(orderItem.paymentSummary.card).toBeNull()
                }
                if (orderItem.paymentSummary.card != null) {
                    expect(orderItem.paymentSummary.card.lastDigits).toMatch(/\d{4}/)
                    expect(card).toContain(orderItem.paymentSummary.card.type)
                }

                let total = orderItem.paymentSummary.subtotal + orderItem.paymentSummary.shipping +
                    orderItem.paymentSummary.accountCredit - orderItem.paymentSummary.voucherAmount
                expect(orderItem.paymentSummary.shipping).toBeLessThanOrEqual(25000)
                expect(orderItem.paymentSummary.subtotal).toBeGreaterThanOrEqual(0)
                expect(orderItem.paymentSummary.total).toBeGreaterThanOrEqual(0)
                expect(orderItem.paymentSummary.accountCredit).toBeLessThanOrEqual(0)
                expect(orderItem.paymentSummary.voucherAmount).toBeGreaterThanOrEqual(0)
                expect(orderItem.paymentSummary.total).toEqual(total)

                for (let product of orderItem.products) {
                    try {
                        expect(product.id).not.toBeEmpty()
                        expect(product.productContentId).not.toBeEmpty()
                        expect(product.title).not.toBeEmpty()
                        expect(product.slug).toInclude(product.productContentId)
                        expect(product.retailPrice).toBeGreaterThanOrEqual(product.salePrice)
                        expect(product.salePrice).toBeLessThanOrEqual(product.totalSalePrice)
                        expect(product.quantity).toBeNumber()
                        expect(product.image.toLowerCase()).toMatch(/\.jpg|\.jpeg|\.png|\.jpe/)
                        expect(product.returnable).toBeBoolean()
                        expect(product.type).not.toBeEmpty()
                        expect(product.brand._id).not.toBeEmpty()
                        expect(product.brand.name).not.toBeEmpty()
                    } catch (error) {
                        throw { failed_product: product, order: orderItem.id, error: error }
                    }
                }
            } catch (error) {
                throw { failed_order: order, error: error }
            }
        }
    })

    test('GET / can see order info using order code', async () => {
        orders = await request.getOrders()

        for (let order of orders) {
            try {
                let orderCode = order.code.split('-')[1]
                let response = await request.get(config.api.orders + '/' + orderCode)
                expect(response.status).toEqual(200)

                if (Array.isArray(response.data)) {
                    for (let item of response.data) {
                        expect(item.code).toInclude(orderCode)
                    }
                } else {
                    expect(response.data.code).toInclude(orderCode)
                }
            } catch (error) {
                throw { failed_order: order, error: error }
            }
        }
    }, 180000)

    test('GET / cannot access order info with invalid cookie', async () => {
        let response = await request.get(config.api.orders + '/5be3ea348f2a5c000155efbc', 'abc')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Invalid request.')
    })

    test('GET / cannot access orders without login', async () => {
        await request.get(config.api.signOut)
        let response = await request.get(config.api.orders)
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })
})