import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";
import * as Model from "../../../../common/interface";

const request = new Utils.CartUtils();
const requestAccount = new Utils.AccountUtils();
const requestProduct = new Utils.ProductUtils();
const requestCart = new Utils.CartUtils();
const access = new Utils.DbAccessUtils();

import test from "ava";

test.beforeEach(async t => {
    t.context["cookie"] = await request.getGuestCookie();
});

test("POST / cannot add invalid product to cart", async t => {
    const res = await request.post(
        config.api.cart,
        {
            productId: "INVALID-ID"
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 500);
    t.deepEqual(
        res.body.message,
        "Argument passed in must be a single String of 12 bytes or a string of 24 hex characters"
    );
    t.snapshot(res.body);
});

test("POST / cannot add empty product to cart", async t => {
    const res = await request.post(
        config.api.cart,
        {
            productId: ""
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 500);
    t.deepEqual(
        res.body.message,
        "Argument passed in must be a single String of 12 bytes or a string of 24 hex characters"
    );
    t.snapshot(res.body);
});

test("POST / cannot add sold out product to cart", async t => {
    const soldOut = await requestProduct.getSoldOutProductInfo(
        config.api.currentSales
    );

    const res = await request.post(
        config.api.cart,
        {
            productId: soldOut.products[0].id
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 500);
    t.deepEqual(res.body.message, "TITLE_IS_OUT_OF_STOCK");
    t.snapshot(res.body);
});

test("POST / cannot add sale ended product to cart", async t => {
    const endedSale = await access.getSale({
        endDate: { $lt: new Date() }
    });

    t.truthy(endedSale);

    const item = await access.getProduct({
        _id: endedSale.products[0].product
    });

    t.truthy(item);

    const res = await request.post(
        config.api.cart,
        {
            productId: item.id
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 500);
    t.deepEqual(res.body.message, "COULD_NOT_RESOLVE_PRODUCT");
    t.snapshot(res.body);
});

test.skip("POST / cannot add more than 8 unique products", async t => {
    const itemList = await requestProduct.getInStockProducts(
        config.api.currentSales,
        1
    );
    t.true(itemList.length > 10);

    for (let i = 0; i < 8; i++) {
        await request.addToCart(itemList[i].id, t.context["cookie"]);
    }

    const account = await requestAccount.getAccountInfo(t.context["cookie"]);
    t.deepEqual(account.cart.length, 8);

    const res = await request.post(
        config.api.cart,
        {
            productId: itemList[8].id
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 500);
    t.deepEqual(res.body.message, "You can only have 8 products in your cart!");
    t.snapshot(res.body);
}); // wait for WWW-618

test("PUT / cannot update quantity in cart to 0", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.currentSales,
        1
    );

    const cart: Model.Cart = await requestCart.addToCart(
        item.id,
        t.context["cookie"]
    );

    const res = await request.put(
        config.api.cart + cart.id,
        {
            quantity: 0
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 500);
    t.deepEqual(res.body.message, "COULD_NOT_UPDATE_ITEM_QUANTITY");
    t.snapshot(res.body);
});

test("PUT / cannot update invalid quantity in cart", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.currentSales,
        1
    );

    const cart: Model.Cart = await requestCart.addToCart(
        item.id,
        t.context["cookie"]
    );

    const res = await request.put(
        config.api.cart + cart.id,
        {
            quantity: -1
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 500);
    t.deepEqual(res.body.message, "COULD_NOT_UPDATE_ITEM_QUANTITY");
    t.snapshot(res.body);
});

test("PUT / cannot update more than max quantity in cart", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.featuredSales,
        1
    );

    const cart: Model.Cart = await requestCart.addToCart(
        item.id,
        t.context["cookie"]
    );

    const res = await request.put(
        config.api.cart + cart.id,
        {
            quantity: 10
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 403);
    t.deepEqual(res.body.message, "ALREADY_REACHED_MAX_QUANTITY");
});

test("DELETE / cannot remove product from cart with wrong cart item", async t => {
    const res = await request.delete(
        config.api.cart + "INVALID-CART-ID",
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(
        res.body.message,
        "NO_CART_ITEM_MATCHING_THAT_ID_EXISTS_IN_THE_USER_CART"
    );
    t.snapshot(res.body);
});

test("DELETE / cannot remove product from cart without cart item", async t => {
    const res = await request.delete(config.api.cart, t.context["cookie"]);

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "Not found");
    t.snapshot(res.body);
});
