import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let checkoutInput: Model.CheckoutInput = {};
let addresses: Model.Addresses;

let request = new Utils.CheckoutUtils();
let requestAddress = new Utils.AddressUtils();
let requestAccount = new Utils.AccountUtils();
let requestCart = new Utils.CartUtils();
let requestProduct = new Utils.ProductUtils();

import test from "ava";

test.beforeEach(async t => {
	t.context["cookie"] = await request.pickRandomUser(
		config.testAccount.email_ex
	);
	await requestCart.emptyCart(t.context["cookie"]);
	addresses = await requestAddress.getAddresses(t.context["cookie"]);
});

test("POST / can send valid order to AccessTrade", async t => {
	let item = await requestProduct.getInStockProduct(
		config.api.currentSales,
		1
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

	const res = await request.post(
		config.api.accesstrade,
		{
			trackingId: "test",
			code: checkout.code
		},
		t.context["cookie"]
	);
	t.snapshot(res.body);

	t.deepEqual(res.statusCode, 200);
	t.true(res.body.status);
});

test("POST / cannot send valid order to AccessTrade without cookie", async t => {
	let item = await requestProduct.getInStockProduct(
		config.api.currentSales,
		1
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

	const res = await request.post(config.api.accesstrade, {
		trackingId: "test",
		code: checkout.code
	});
	t.snapshot(res.body);

	t.deepEqual(res.statusCode, 404);
	t.deepEqual(res.body.message, "Order not found.");
});
