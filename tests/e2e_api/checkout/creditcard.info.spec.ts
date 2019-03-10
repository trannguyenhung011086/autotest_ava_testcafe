import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let creditcards: Model.CreditCard[];
let checkoutInput: Model.CheckoutInput = {};
let addresses: Model.Addresses;

let request = new Utils.CreditCardUtils();
let requestCheckout = new Utils.CheckoutUtils();
let requestAddress = new Utils.AddressUtils();
let requestAccount = new Utils.AccountUtils();
let requestCart = new Utils.CartUtils();
let requestProduct = new Utils.ProductUtils();

import test from "ava";

test.before(async t => {
	t.context["cookie"] = await request.getLogInCookie(
		config.testAccount.email_ex[12],
		config.testAccount.password_ex
	);

	addresses = await requestAddress.getAddresses(t.context["cookie"]);

	let item = await requestProduct.getInStockProduct(
		config.api.internationalSales,
		1
	);
	await requestCart.addToCart(item.id, t.context["cookie"]);

	let stripeData = {
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
	checkoutInput.saveNewCard = true;
	checkoutInput.stripeSource = await request
		.postFormUrl(
			"/v1/sources",
			stripeData,
			t.context["cookie"],
			config.stripeBase
		)
		.then(res => res.body);

	let checkout = await requestCheckout.checkoutStripe(
		checkoutInput,
		t.context["cookie"]
	);
	t.truthy(checkout.orderId);
});

test.serial("GET / can access creditcard info", async t => {
	const res = await request.get(config.api.creditcard, t.context["cookie"]);
	creditcards = res.body;

	creditcards.forEach(card => {
		t.truthy(card.cardholderName);
		t.truthy(card.id);
		t.regex(card.lastDigits, /\d{4}/);
		t.regex(card.type.toLowerCase(), /visa|master/);

		if (card.provider) {
			t.deepEqual(card.provider, "STRIPE");
		}
	});
});

test.serial("DELETE / cannot delete invalid creditcard", async t => {
	let res = await request.get(config.api.creditcard, t.context["cookie"]);
	creditcards = res.body;

	res = await request.delete(
		config.api.creditcard + "/INVALID-ID",
		t.context["cookie"]
	);

	t.deepEqual(res.statusCode, 500);
	t.deepEqual(res.body.message, "INVALID_CREDIT_CARD_OR_CANNOT_DELETE");
});

test.serial("DELETE / can delete creditcard (skip-prod)", async t => {
	if (process.env.NODE_ENV == "prod") {
		t.pass();
	} else {
		let res = await request.get(config.api.creditcard, t.context["cookie"]);
		creditcards = res.body;

		if (creditcards.length > 0) {
			res = await request.delete(
				config.api.creditcard + "/" + creditcards[0].id,
				t.context["cookie"]
			);

			t.deepEqual(res.statusCode, 200);
			t.true(res.body);
		}
	}
});

test("GET / cannot access creditcard info with invalid cookie", async t => {
	const res = await request.get(
		config.api.creditcard,
		"leflair.connect2.sid=test"
	);

	t.deepEqual(res.statusCode, 401);
	t.deepEqual(res.body.message, "Access denied.");
});
