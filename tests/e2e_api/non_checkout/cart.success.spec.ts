import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

const request = new Utils.CartUtils();
const requestProduct = new Utils.ProductUtils();
const requestCart = new Utils.CartUtils();

import test from "ava";

test.beforeEach(async t => {
    t.context["cookie"] = await request.getGuestCookie();
});

test.afterEach.always(async t => {
    await request.emptyCart(t.context["cookie"]);
});

test("Get 200 success code when adding product to cart as guest", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.todaySales,
        1
    );

    const cart: Model.Cart = await requestCart.addToCart(
        item.id,
        t.context["cookie"]
    );

    t.truthy(cart.id);
    t.deepEqual(cart.productId, item.id);
    t.truthy(cart.title);
    t.true(request.validateImage(cart.image));
    t.deepEqual(cart.quantity, 1);
    t.true(cart.retailPrice >= cart.salePrice);
    t.true(cart.availableQuantity >= 1);
    t.true(cart.slug.includes(cart.productContentId));
    t.truthy(cart.categories);
    t.regex(cart.country, /VN|SG/);
    t.false(cart.saleEnded);
    t.truthy(cart.nsId);
});

test("Get 200 success code when adding same product to cart", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.currentSales,
        2
    );

    let cart: Model.Cart = await requestCart.addToCart(
        item.id,
        t.context["cookie"]
    );

    t.deepEqual(cart.quantity, 1);

    cart = await requestCart.addToCart(item.id, t.context["cookie"]);

    t.deepEqual(cart.quantity, 2);
});

test("Get 200 success code when deleting product from cart", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.todaySales,
        1
    );

    const cart: Model.Cart = await requestCart.addToCart(
        item.id,
        t.context["cookie"]
    );

    const res = await request.delete(
        config.api.cart + cart.id,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(res.body.message, "ITEM_REMOVED_FROM_CART");
});

test("Get 200 success code when deleting multiple products from cart", async t => {
    const itemA = await requestProduct.getInStockProduct(
        config.api.featuredSales,
        1
    );

    const cartA: Model.Cart = await requestCart.addToCart(
        itemA.id,
        t.context["cookie"]
    );

    const itemB = await requestProduct.getInStockProduct(
        config.api.potdSales,
        1
    );

    const cartB: Model.Cart = await requestCart.addToCart(
        itemB.id,
        t.context["cookie"]
    );

    const res = await request.put(
        config.api.cart + "delete-multiple",
        {
            cartItemIds: [cartA.id, cartB.id]
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(res.body.message, "ITEM_REMOVED_FROM_CART");
});

test("Get 200 success code when updating cart after sign in", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.currentSales,
        1
    );

    const cart: Model.Cart = await requestCart.addToCart(
        item.id,
        t.context["cookie"]
    );

    const signIn = await request.post(
        config.api.signIn,
        {
            email: config.testAccount.email_ex[2],
            password: config.testAccount.password_ex
        },
        t.context["cookie"]
    );

    t.deepEqual(signIn.body.cart[0], cart);
});
