import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let checkoutInput: Model.CheckoutInput = {}
let addresses: Model.Addresses

let request = new Utils.CheckoutUtils
let requestAddress = new Utils.AddressUtils
let requestAccount = new Utils.AccountUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils

import test from 'ava'

test.before(async t => {
    t.context['cookie'] = await request.getLogInCookie(config.testAccount.email_ex[3],
        config.testAccount.password_ex)

    addresses = await requestAddress.getAddresses(t.context['cookie'])
})

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context['cookie'])
})

test.serial('POST / can send valid order to AccessTrade', async t => {
    let item = await requestProduct.getInStockProduct(config.api.currentSales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses

    let checkout = await request.checkoutCod(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    const res = await request.post(config.api.accesstrade, {
        trackingId: 'test',
        code: checkout.code
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 200)
    t.true(res.body.status)
})

test.serial('POST / cannot send valid order to AccessTrade without cookie', async t => {
    let item = await requestProduct.getInStockProduct(config.api.currentSales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses

    let checkout = await request.checkoutCod(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    const res = await request.post(config.api.accesstrade, {
        trackingId: 'test',
        code: checkout.code
    })

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'Order not found.')
})