import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as model from '../../../common/interface'

let cookie: string
let account: model.Account
let orders: model.OrderSummary[]
let orderItem: model.Order

let request = new Utils.OrderUtils
let requestAccount = new Utils.AccountUtils

export const OrdersInfoTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
        account = await requestAccount.getAccountInfo(cookie)
        jest.setTimeout(120000)
    })

    it('GET / cannot see order of another customer', async () => {
        let res = await request.get(config.api.orders + '/5be3ea348f2a5c000155efbc', cookie)
        expect(res.statusCode).toEqual(200)
        expect(res.body).toBeEmpty()
    })

    it('GET / can access orders', async () => {
        let res = await request.get(config.api.orders, cookie)
        orders = res.body

        expect(res.statusCode).toEqual(200)
        orders.forEach(order => {
            try {
                expect(order.id).not.toBeEmpty()
                expect(order.code).toMatch(/^SG|HK|VN/)
                expect(request.validateDate(order.createdDate)).toBeTrue()
                expect(order.status).toMatch(/pending|placed|confirmed|cancelled|shipped|delivered|return request|returned/)

                if (order.shippedDate != null) {
                    expect(request.validateDate(order.shippedDate)).toBeTrue()
                }
                if (order.deliveredDate != null) {
                    expect(request.validateDate(order.deliveredDate)).toBeTrue()
                }
            } catch (error) {
                throw { failed_order: order, error: error }
            }
        })
    })

    it('GET / can see order info using order ID', async () => {
        orders = await request.getOrders(cookie)

        for (let order of orders) {
            try {
                let res = await request.get(config.api.orders + '/' + order.id, cookie)
                orderItem = res.body
                expect(res.statusCode).toEqual(200)

                expect(orderItem.id).toEqual(order.id)
                expect(orderItem.code).toMatch(/^SG|HK|VN/)
                expect(request.validateDate(orderItem.createdDate)).toBeTrue()
                expect(order.status).toMatch(/pending|placed|confirmed|cancelled|shipped|delivered|return request|returned/)

                if (orderItem.shippedDate != null) {
                    expect(request.validateDate(orderItem.shippedDate)).toBeTrue()
                }
                if (orderItem.deliveredDate != null) {
                    expect(request.validateDate(orderItem.deliveredDate)).toBeTrue()
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

                expect(orderItem.paymentSummary.method).toMatch(/COD|STRIPE|CC|FREE/)

                if (orderItem.paymentSummary.method == 'COD' ||
                    orderItem.paymentSummary.method == 'STRIPE') {
                    expect(orderItem.paymentSummary.card).toBeNull()
                }
                if (orderItem.paymentSummary.card != null) {
                    expect(orderItem.paymentSummary.card.lastDigits).toMatch(/\d{4}/)
                    expect(orderItem.paymentSummary.card.type).toMatch(/VISA|Master/)
                }

                expect(orderItem.paymentSummary.shipping).toBeLessThanOrEqual(25000)
                expect(orderItem.paymentSummary.subtotal).toBeGreaterThanOrEqual(0)
                expect(orderItem.paymentSummary.accountCredit).toBeLessThanOrEqual(0)
                expect(orderItem.paymentSummary.voucherAmount).toBeGreaterThanOrEqual(0)
                expect(orderItem.paymentSummary.total).toBeGreaterThanOrEqual(0)

                let total = orderItem.paymentSummary.subtotal + orderItem.paymentSummary.shipping +
                    orderItem.paymentSummary.accountCredit - orderItem.paymentSummary.voucherAmount
                if (total >= 0) {
                    expect(orderItem.paymentSummary.total).toEqual(total)
                }

                orderItem.products.forEach(product => {
                    try {
                        expect(product.id).not.toBeEmpty()
                        expect(product.productContentId).not.toBeEmpty()
                        expect(product.title).not.toBeEmpty()
                        expect(product.slug).toInclude(product.productContentId)
                        // expect(product.retailPrice).toBeGreaterThanOrEqual(product.salePrice)
                        expect(product.salePrice).toBeLessThanOrEqual(product.totalSalePrice)
                        expect(product.quantity).toBeNumber()
                        expect(request.validateImage(product.image)).toBeTrue()
                        expect(product.returnable).toBeBoolean()
                        expect(product.type).not.toBeEmpty()
                        expect(product.brand._id).not.toBeEmpty()
                        expect(product.brand.name).not.toBeEmpty()
                    } catch (error) {
                        throw { failed_product: product, order: orderItem.id, error: error }
                    }
                })
            } catch (error) {
                throw { failed_order: orderItem, error: error }
            }
        }
    })

    it('GET / can see order info using order code', async () => {
        orders = await request.getOrders(cookie)

        for (let order of orders) {
            try {
                let orderCode = order.code.split('-')[1]
                let res = await request.get(config.api.orders + '/' + orderCode, cookie)
                expect(res.statusCode).toEqual(200)

                if (Array.isArray(res.body)) {
                    for (let item of res.body) {
                        expect(item.code).toInclude(orderCode)
                    }
                } else {
                    expect(res.body.code).toInclude(orderCode)
                }
            } catch (error) {
                throw { failed_order: order, error: error }
            }
        }
    }, 180000)

    it('GET / cannot access order info with invalid cookie', async () => {
        let res = await request.get(config.api.orders + '/5be3ea348f2a5c000155efbc', 'leflair.connect2.sid=test')

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('Invalid request.')
    })

    it('GET / cannot access orders without login', async () => {
        await request.get(config.api.signOut, cookie)
        let res = await request.get(config.api.orders, cookie)

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('Access denied.')
    })
}

describe('User orders info API ' + config.baseUrl + config.api.orders, OrdersInfoTest)