import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let cookie: string
let account: Model.Account
let orders: Model.OrderSummary[]
let orderItem: Model.Order

let request = new Utils.OrderUtils
let requestAccount = new Utils.AccountUtils

import test, { ExecutionContext } from 'ava'

export function validateOrderSummary(t: ExecutionContext, order: Model.OrderSummary) {
    if (order.code) {
        t.regex(order.code, /^SG|HK|VN/)
    }
    t.true(request.validateDate(order.createdDate))
    t.regex(order.status, /pending|placed|confirmed|cancelled|shipped|delivered|return request|returned/)

    if (order.shippedDate) {
        t.true(request.validateDate(order.shippedDate))
    }
    if (order.deliveredDate) {
        t.true(request.validateDate(order.deliveredDate))
    }
}

export function validateAddress(t: ExecutionContext, address: any) {
    t.truthy(address.address)
    t.truthy(address.city)
    t.truthy(address.district)
    t.truthy(address.firstName)
    t.truthy(address.lastName)
    t.truthy(address.phone)
}

export function validatePayment(t: ExecutionContext, payment: Model.PaymentSummary) {
    t.regex(payment.method, /COD|STRIPE|CC|FREE/)

    if (payment.method == 'COD' || payment.method == 'STRIPE') {
        t.falsy(payment.card)
    }
    if (payment.card) {
        t.regex(payment.card.lastDigits, /\d{4}/)
        t.regex(payment.card.type, /VISA|Master/)
    }

    t.true(payment.shipping <= 25000)
    t.true(payment.subtotal >= 0)
    t.true(payment.accountCredit <= 0)
    t.true(payment.voucherAmount >= 0)
    t.true(payment.total >= 0)

    const total = payment.subtotal + payment.shipping + payment.accountCredit - payment.voucherAmount

    if (total >= 0) {
        t.deepEqual(orderItem.paymentSummary.total, total)
    }
}

export function validateProduct(t: ExecutionContext, product: Model.OrderedProduct) {
    t.truthy(product.id)
    t.truthy(product.productContentId)
    t.truthy(product.title)
    t.true(product.slug.includes(product.productContentId))
    t.true.skip(product.retailPrice >= product.salePrice)
    t.true(product.salePrice <= product.totalSalePrice)
    t.true(product.quantity > 0)
    t.true(request.validateImage(product.image))
    t.deepEqual(typeof (product.returnable), 'boolean')
    t.truthy(product.type)
    t.truthy(product.brand._id)
    t.truthy(product.brand.name)
    t.truthy(product.nsId)
    t.truthy(product.productId)
}

export function validateOrderDetail(t: ExecutionContext, orderItem: Model.Order) {
    validateOrderSummary(t, orderItem)

    t.deepEqual(typeof (orderItem.isBulky), 'boolean')

    if (orderItem.isCrossBorder) {
        t.deepEqual(typeof (orderItem.isCrossBorder), 'boolean')
    }

    t.deepEqual(typeof (orderItem.isFirstOrder), 'boolean')
    t.deepEqual(typeof (orderItem.isVirtual), 'boolean')

    t.regex(orderItem.tracking, /dhlecommerce\.asia|ghn\.vn/)
    t.deepEqual(orderItem.user, account.id)

    validateAddress(t, orderItem.address.billing)
    validateAddress(t, orderItem.address.shipping)
    validatePayment(t, orderItem.paymentSummary)

    orderItem.products.forEach(product => {
        validateProduct(t, product)
    })
}

test.before(async t => {
    cookie = await request.getLogInCookie(config.testAccount.email_in,
        config.testAccount.password_in)

    account = await requestAccount.getAccountInfo(cookie)
})

test('GET / cannot see order of another customer', async t => {
    let res = await request.get(config.api.orders + '/5be3ea348f2a5c000155efbc', cookie)

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(res.body.length, 0)
})

test('GET / can access orders', async t => {
    let res = await request.get(config.api.orders, cookie)
    orders = res.body

    orders.forEach(order => {
        validateOrderSummary(t, order)
    })
})

test('GET / can see order info using order ID', async t => {
    orders = await request.getOrders(cookie)

    for (let order of orders) {
        let res = await request.get(config.api.orders + '/' + order.id, cookie)
        orderItem = res.body

        validateOrderDetail(t, orderItem)
    }
})

test('GET / can see order info using order code', async t => {
    orders = await request.getOrders(cookie)

    for (let order of orders) {
        const orderCode = order.code.split('-')[1]
        const res = await request.get(config.api.orders + '/' + orderCode, cookie)
        orderItem = res.body

        validateOrderDetail(t, orderItem)
    }
})

test('GET / cannot access order info with invalid cookie', async t => {
    let res = await request.get(config.api.orders + '/5be3ea348f2a5c000155efbc', 'leflair.connect2.sid=test')

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'Invalid request.')
})