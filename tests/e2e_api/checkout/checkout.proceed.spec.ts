import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let checkout: Model.Checkout;
let item: Model.Product;
let cart: Model.Cart;

let helper = new Utils.Helper();
let requestCart = new Utils.CartUtils();
let requestProduct = new Utils.ProductUtils();

import test from "ava";

test.beforeEach(async t => {
	t.context["cookie"] = await helper.getGuestCookie();
});

test("GET / proceed checkout with empty cart", async t => {
	const res = await helper.get(config.api.checkout, t.context["cookie"]);
	checkout = res.body;

	t.deepEqual(res.statusCode, 200);
	t.deepEqual(checkout.cart.length, 0);
});

test("GET / proceed checkout with cart", async t => {
	item = await requestProduct.getInStockProduct(config.api.featuredSales, 1);

	let res = await helper.post(
		config.api.cart,
		{
			productId: item.id
		},
		t.context["cookie"]
	);
	cart = res.body;

	res = await helper.get(config.api.checkout, t.context["cookie"]);
	checkout = res.body;

	t.deepEqual(res.statusCode, 200);
	t.deepEqual(checkout.cart[0], cart);
});
