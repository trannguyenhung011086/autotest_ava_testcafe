import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

const checkoutInput: Model.CheckoutInput = {};
let addresses: Model.Addresses;

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
        config.testAccount.email_in,
        config.testAccount.password_in
    );

    addresses = await requestAddress.getAddresses(t.context["cookie"]);
});

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context["cookie"]);
});

test.serial("Not auto-confirm order when value >= 5,000,000", async t => {
    const items = await requestProduct.getInStockProducts(
        config.api.currentSales,
        1,
        1000000
    );

    t.true(items.length >= 5);

    for (const item of items.slice(0, 5)) {
        await requestCart.addToCart(item.id, t.context["cookie"], true);
    }

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
    t.deepEqual(order.status, "placed");
    t.true(order.paymentSummary.total >= 5000000);
});

test.serial("Not auto-confirm order when quantity >= 2", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.currentSales,
        2
    );
    await requestCart.addToCart(item.id, t.context["cookie"]);
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
    t.deepEqual(order.status, "placed");
    t.true(order.products[0].quantity >= 2);
});

test.serial("Not auto-confirm order when sum quantiy >= 5", async t => {
    const items = await requestProduct.getInStockProducts(
        config.api.currentSales,
        2
    );
    for (const item of items.slice(0, 6)) {
        await requestCart.addToCart(item.id, t.context["cookie"]);
    }

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
    t.deepEqual(order.status, "placed");

    let sum = 0;
    for (const product of order.products) {
        sum += product.quantity;
    }
    t.true(sum >= 5);
});

test.serial("Not auto-confirm international order (skip-prod)", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.internationalSales,
        1
    );
    await requestCart.addToCart(item.id, t.context["cookie"]);

    const stripeData = {
        type: "card",
        "card[cvc]": "222",
        "card[exp_month]": "02",
        "card[exp_year]": "22",
        "card[number]": "4000000000000077",
        key: config.stripeKey
    };

    checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
    );
    checkoutInput.addresses = addresses;
    checkoutInput.stripeSource = await request
        .postFormUrl(
            "/v1/sources",
            stripeData,
            t.context["cookie"],
            config.stripeBase
        )
        .then(res => res.body);

    const checkout = await request.checkoutStripe(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const order = await requestOrder.getOrderInfo(
        checkout.orderId,
        t.context["cookie"]
    );
    t.deepEqual(order.status, "placed");
});

test.serial("Auto-confirm order for regular customer", async t => {
    // regular customer has at least 1 order with status 'delivered'/'return request'/'returned'
    // new order must use same address with old order

    // 1st checkout to get placed order
    const item = await requestProduct.getInStockProduct(
        config.api.currentSales,
        2
    );
    await requestCart.addToCart(item.id, t.context["cookie"]);

    checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
    );
    checkoutInput.addresses = addresses;

    let checkout = await request.checkoutCod(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    let order = await requestOrder.getOrderInfo(
        checkout.orderId,
        t.context["cookie"]
    );
    t.deepEqual(order.status, "placed");

    // update 1st checkout order status
    await access.updateOrderStatus(order.code, "delivered");

    // 2nd checkout
    await requestCart.addToCart(item.id, t.context["cookie"]);

    checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
    );
    checkout = await request.checkoutCod(checkoutInput, t.context["cookie"]);
    order = await requestOrder.getOrderInfo(
        checkout.orderId,
        t.context["cookie"]
    );
    t.deepEqual(order.status, "confirmed");
});
