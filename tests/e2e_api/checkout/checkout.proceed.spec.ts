import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

const helper = new Utils.Helper();
const requestCart = new Utils.CartUtils();
const requestProduct = new Utils.ProductUtils();

import test from "ava";

test.beforeEach(async t => {
    t.context["cookie"] = await helper.getGuestCookie();
});

test("Proceed checkout with empty cart", async t => {
    const res = await helper.get(config.api.checkout, t.context["cookie"]);

    const checkout: Model.Checkout = res.body;

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(checkout.cart.length, 0);
    t.snapshot(res.body);
});

test("Proceed checkout with cart", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.featuredSales,
        1
    );

    const cart = await requestCart.addToCart(item.id, t.context["cookie"]);

    const res = await helper.get(config.api.checkout, t.context["cookie"]);

    const checkout: Model.Checkout = res.body;

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(checkout.cart[0], cart);
});
