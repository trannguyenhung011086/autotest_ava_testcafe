import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let account: Model.Account
let customer: Model.Customer
let item: Model.Product
let addresses: Model.Addresses
let checkoutInput: Model.CheckoutInput = {}

let request = new Utils.CheckoutUtils
let requestAddress = new Utils.AddressUtils
let requestAccount = new Utils.AccountUtils
let requestCart = new Utils.CartUtils
let requestProduct = new Utils.ProductUtils
let requestOrder = new Utils.OrderUtils
let access = new Utils.DbAccessUtils

import test from 'ava'

test.before(async t => {
    t.context['cookie'] = await request.getLogInCookie(config.testAccount.email_ex[5],
        config.testAccount.password_ex)

    addresses = await requestAddress.getAddresses(t.context['cookie'])

    account = await requestAccount.getAccountInfo(t.context['cookie'])
    customer = await access.getCustomerInfo({ email: account.email })
})

test('POST / can send to Mailchimp', async t => {
    item = await requestProduct.getInStockProduct(config.api.todaySales, 1)
    await requestCart.addToCart(item.id, t.context['cookie'])

    checkoutInput.account = await requestAccount.getAccountInfo(t.context['cookie'])
    checkoutInput.addresses = addresses

    let checkout = await request.checkoutCod(checkoutInput, t.context['cookie'])
    t.truthy(checkout.orderId)

    let order = await requestOrder.getOrderInfo(checkout.orderId, t.context['cookie'])

    const res = await request.post(config.api.mailchimp, {
        "order": {
            "id": checkout.orderId,
            "customer": {
                "id": customer._id,
                "email_address": customer.email,
                "opt_in_status": true
            },
            "currency_code": "VND",
            "order_total": order.paymentSummary.total,
            "lines": [
                {
                    "id": order.products[0].id,
                    "product_id": order.products[0].productContentId,
                    "product_variant_id": order.products[0].productId,
                    "quantity": order.products[0].quantity,
                    "price": order.products[0].salePrice.toString()
                }
            ],
            "order_url": config.baseUrl +  "/vn/checkout/thank-you/" + checkout.code,
            "processed_at_foreign": new Date().toLocaleString()
        }
    }, t.context['cookie'])

    if (process.env.NODE_ENV == 'prod') {
        t.deepEqual(res.statusCode, 200)
        t.deepEqual(res.body.message, 'done')
    } else {
        t.deepEqual(res.statusCode, 400)
        t.deepEqual(res.body.message, 'fail')
    }
})