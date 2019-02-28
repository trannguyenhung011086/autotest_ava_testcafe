import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let cookie: string
let checkoutInput: Model.CheckoutInput = {}
let addresses: Model.Addresses

let request = new Utils.CheckoutUtils
let requestAddress = new Utils.AddressUtils
let requestAccount = new Utils.AccountUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils

import test from 'ava'

test.before(async t => {
    cookie = await request.getLogInCookie(config.testAccount.email_ex_3,
        config.testAccount.password_ex_3)
        
    await requestAddress.addAddresses(cookie)
    addresses = await requestAddress.getAddresses(cookie)
})

test.beforeEach(async t => {
    await requestCart.emptyCart(cookie)
})

test.after.always(async t => {
    await requestAddress.deleteAddresses(cookie)
})

test.serial('POST / can send valid order to AccessTrade', async t => {
    let item = await requestProduct.getInStockProduct(config.api.currentSales, 1)
    await requestCart.addToCart(item.id, cookie)

    checkoutInput.account = await requestAccount.getAccountInfo(cookie)
    checkoutInput.addresses = addresses

    let checkout = await request.checkoutCod(checkoutInput, cookie)

    let res = await request.post('/api/v2/user-orders/accesstrade', {
        trackingId: 'test',
        code: checkout.code
    }, cookie)

    t.deepEqual(res.statusCode, 200)
    t.true(res.body.status)
})

test.serial('POST / cannot send valid order to AccessTrade without cookie', async t => {
    let item = await requestProduct.getInStockProduct(config.api.currentSales, 1)
    await requestCart.addToCart(item.id, cookie)

    checkoutInput.account = await requestAccount.getAccountInfo(cookie)
    checkoutInput.addresses = addresses

    let checkout = await request.checkoutCod(checkoutInput, cookie)

    let res = await request.post('/api/v2/user-orders/accesstrade', {
        trackingId: 'test',
        code: checkout.code
    })

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'Order not found.')
})