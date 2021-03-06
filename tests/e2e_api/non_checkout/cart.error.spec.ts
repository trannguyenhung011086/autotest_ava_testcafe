import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

const request = new Utils.CartUtils();
const requestAccount = new Utils.AccountUtils();
const requestProduct = new Utils.ProductUtils();
const requestCart = new Utils.CartUtils();
const access = new Utils.DbAccessUtils();

import test from "ava";

test.beforeEach(async t => {
    t.context["cookie"] = await request.getGuestCookie();
});

test("Get 500 error code when adding invalid product to cart", async t => {
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
});

test("Get 500 error code when adding empty product to cart", async t => {
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
});

test("Get 500 error code when adding sold out product to cart", async t => {
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
});

test("Get 500 error code when adding sale ended product to cart", async t => {
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
});

test.skip("Get 500 error code when adding more than 8 unique products", async t => {
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
}); // wait for WWW-618

test("Get 500 error code when updating quantity in cart to 0", async t => {
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
});

test("Get 500 error code when updating invalid quantity in cart", async t => {
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
});

test("Get 403 error code when updating more than max quantity in cart", async t => {
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

test("Get 404 error code when deleting product from cart with wrong cart item", async t => {
    const res = await request.delete(
        config.api.cart + "INVALID-CART-ID",
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(
        res.body.message,
        "NO_CART_ITEM_MATCHING_THAT_ID_EXISTS_IN_THE_USER_CART"
    );
});

test("Get 404 error code when deleting product from cart without cart item", async t => {
    const res = await request.delete(config.api.cart, t.context["cookie"]);

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "Not found");
});
