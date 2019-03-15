import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let customer: Model.Customer;
let addresses: Model.Addresses;
const checkoutInput: Model.CheckoutInput = {};

const request = new Utils.CheckoutUtils();
const requestAddress = new Utils.AddressUtils();
const requestAccount = new Utils.AccountUtils();
const requestCart = new Utils.CartUtils();
const requestProduct = new Utils.ProductUtils();
const requestOrder = new Utils.OrderUtils();
const access = new Utils.DbAccessUtils();

import test from "ava";

test.before(async t => {
    t.context["cookie"] = await request.getLogInCookie(
        config.testAccount.email_ex[5],
        config.testAccount.password_ex
    );

    addresses = await requestAddress.getAddresses(t.context["cookie"]);
    customer = await access.getCustomerInfo({
        email: config.testAccount.email_ex[5].toLowerCase()
    });
});

test("POST / can send to Mailchimp", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.todaySales,
        1
    );
    await requestCart.addToCart(item.id, t.context["cookie"]);

    checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
    );
    checkoutInput.addresses = addresses;

    const checkout = await request.checkoutCod(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const order = await requestOrder.getOrderInfo(
        checkout.orderId,
        t.context["cookie"]
    );

    const res = await request.post(
        config.api.mailchimp,
        {
            order: {
                id: checkout.orderId,
                customer: {
                    id: customer._id,
                    email_address: customer.email,
                    opt_in_status: true
                },
                currency_code: "VND",
                order_total: order.paymentSummary.total,
                lines: [
                    {
                        id: order.products[0].id,
                        product_id: order.products[0].productContentId,
                        product_variant_id: order.products[0].productId,
                        quantity: order.products[0].quantity,
                        price: order.products[0].salePrice.toString()
                    }
                ],
                order_url:
                    config.baseUrl + "/vn/checkout/thank-you/" + checkout.code,
                processed_at_foreign: new Date().toLocaleString()
            }
        },
        t.context["cookie"]
    );

    if (process.env.NODE_ENV == "prod") {
        t.deepEqual(res.statusCode, 200);
        t.deepEqual(res.body.message, "done");
    } else {
        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "fail");
    }
});
