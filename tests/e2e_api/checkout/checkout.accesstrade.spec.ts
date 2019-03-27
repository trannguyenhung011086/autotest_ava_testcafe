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

import test from "ava";

test.beforeEach(async t => {
    t.context["cookie"] = await request.pickRandomUser(
        config.testAccount.email_ex
    );
    await requestCart.emptyCart(t.context["cookie"]);
    addresses = await requestAddress.getAddresses(t.context["cookie"]);
});

test("Get 200 success code when sending valid order to AccessTrade", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.currentSales,
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

    const res = await request.post(
        config.api.accesstrade,
        {
            trackingId: "test",
            code: checkout.code
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 200);
    t.true(res.body.status);
});

test("Get 404 error code when sending valid order to AccessTrade without cookie", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.currentSales,
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

    const res = await request.post(config.api.accesstrade, {
        trackingId: "test",
        code: checkout.code
    });

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "Order not found.");
});
