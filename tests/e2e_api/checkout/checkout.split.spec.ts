import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let account: Model.Account;
let customer: Model.Customer;
let addresses: Model.Addresses;
let checkoutInput: Model.CheckoutInput = {};

let request = new Utils.CheckoutUtils();
let requestAddress = new Utils.AddressUtils();
let requestAccount = new Utils.AccountUtils();
let requestCart = new Utils.CartUtils();
let requestProduct = new Utils.ProductUtils();
let requestOrder = new Utils.OrderUtils();
let access = new Utils.DbAccessUtils();

const stripeData = {
	"card[number]": "5555555555554444",
	type: "card",
	"card[cvc]": "222",
	"card[exp_month]": "02",
	"card[exp_year]": "22",
	key: config.stripeKey
};

let stripeSource: any;

import test from "ava";

test.before(async t => {
	t.context["cookie"] = await request.getLogInCookie(
		config.testAccount.email_ex[10],
		config.testAccount.password_ex
	);

	addresses = await requestAddress.getAddresses(t.context["cookie"]);
	account = await requestAccount.getAccountInfo(t.context["cookie"]);
	customer = await access.getCustomerInfo({ email: account.email });
});

test.beforeEach(async t => {
	await requestCart.emptyCart(t.context["cookie"]);

	stripeSource = await request
		.postFormUrl(
			"/v1/sources",
			stripeData,
			t.context["cookie"],
			config.stripeBase
		)
		.then(res => res.body);
});

test.serial("POST / not split SG order when total < 1,000,000", async t => {
	let itemSG1 = await requestProduct.getProductWithCountry("SG", 0, 400000);
	let itemSG2 = await requestProduct.getProductWithCountry(
		"SG",
		400000,
		500000
	);

	await requestCart.addToCart(itemSG1.id, t.context["cookie"]);
	await requestCart.addToCart(itemSG2.id, t.context["cookie"]);

	checkoutInput.account = await requestAccount.getAccountInfo(
		t.context["cookie"]
	);
	checkoutInput.addresses = addresses;
	checkoutInput.saveNewCard = false;
	checkoutInput.stripeSource = stripeSource;

	let checkout = await request.checkoutStripe(
		checkoutInput,
		t.context["cookie"]
	);
	t.truthy(checkout.orderId);

	let order = await requestOrder.getOrderInfo(
		checkout.code,
		t.context["cookie"]
	);

	t.false(Array.isArray(order));
	t.deepEqual(order.code, `SGVN-${checkout.code}-1`);
	t.true(order.isCrossBorder);
	t.deepEqual(order.paymentSummary.method, "STRIPE");

	for (let product of order.products) {
		if (product.productId == itemSG1.id) {
			t.deepEqual(product.salePrice, itemSG1.salePrice);
		}
		if (product.productId == itemSG2.id) {
			t.deepEqual(product.salePrice, itemSG2.salePrice);
		}
	}
});

test.serial.skip(
	"POST / not split HK order when total < 1,000,000",
	async t => {
		// skip due to not have HK stock now
		let itemHK1 = await requestProduct.getProductWithCountry(
			"HK",
			0,
			400000
		);
		let itemHK2 = await requestProduct.getProductWithCountry(
			"HK",
			400000,
			500000
		);

		await requestCart.addToCart(itemHK1.id, t.context["cookie"]);
		await requestCart.addToCart(itemHK2.id, t.context["cookie"]);

		checkoutInput.account = await requestAccount.getAccountInfo(
			t.context["cookie"]
		);
		checkoutInput.addresses = addresses;
		checkoutInput.saveNewCard = false;
		checkoutInput.stripeSource = stripeSource;

		let checkout = await request.checkoutStripe(
			checkoutInput,
			t.context["cookie"]
		);
		t.truthy(checkout.orderId);

		let order = await requestOrder.getOrderInfo(
			checkout.code,
			t.context["cookie"]
		);

		t.false(Array.isArray(order));
		t.deepEqual(order.code, `SGVN-${checkout.code}-1`);
		t.true(order.isCrossBorder);
		t.deepEqual(order.paymentSummary.method, "STRIPE");

		for (let product of order.products) {
			if (product.productId == itemHK1.id) {
				t.deepEqual(product.salePrice, itemHK1.salePrice);
			}
			if (product.productId == itemHK2.id) {
				t.deepEqual(product.salePrice, itemHK2.salePrice);
			}
		}
	}
);

test.serial("POST / split SG order when total >= 1,000,000", async t => {
	let itemSG1 = await requestProduct.getProductWithCountry("SG", 0, 800000);
	let itemSG2 = await requestProduct.getProductWithCountry(
		"SG",
		900000,
		2000000
	);

	await requestCart.addToCart(itemSG1.id, t.context["cookie"]);
	await requestCart.addToCart(itemSG2.id, t.context["cookie"]);

	checkoutInput.account = await requestAccount.getAccountInfo(
		t.context["cookie"]
	);
	checkoutInput.addresses = addresses;
	checkoutInput.saveNewCard = false;
	checkoutInput.stripeSource = stripeSource;

	let checkout = await request.checkoutStripe(
		checkoutInput,
		t.context["cookie"]
	);
	t.truthy(checkout.orderId);

	let orders = await requestOrder.getSplitOrderInfo(
		checkout.code,
		t.context["cookie"]
	);

	t.deepEqual(orders.length, 2);

	for (let order of orders) {
		if (order.products[0].productId == itemSG1.id) {
			t.deepEqual(order.products[0].salePrice, itemSG1.salePrice);
			t.deepEqual(order.paymentSummary.total, itemSG1.salePrice);
		}
		if (order.products[0].productId == itemSG2.id) {
			t.deepEqual(order.products[0].salePrice, itemSG2.salePrice);
			t.deepEqual(order.paymentSummary.total, itemSG2.salePrice);
		}
		t.true(order.code.includes(checkout.code));
		t.regex(order.code, /SGVN-.+-\d/);
		t.true(order.isCrossBorder);
		t.deepEqual(order.paymentSummary.method, "STRIPE");
	}
});

test.serial.skip("POST / split HK order when total >= 1,000,000", async t => {
	// skip due to not have HK stock now
	let itemHK1 = await requestProduct.getProductWithCountry("HK", 0, 800000);
	let itemHK2 = await requestProduct.getProductWithCountry(
		"HK",
		900000,
		2000000
	);

	await requestCart.addToCart(itemHK1.id, t.context["cookie"]);
	await requestCart.addToCart(itemHK2.id, t.context["cookie"]);

	checkoutInput.account = await requestAccount.getAccountInfo(
		t.context["cookie"]
	);
	checkoutInput.addresses = addresses;
	checkoutInput.saveNewCard = false;
	checkoutInput.stripeSource = stripeSource;

	let checkout = await request.checkoutStripe(
		checkoutInput,
		t.context["cookie"]
	);
	t.truthy(checkout.orderId);

	let orders = await requestOrder.getSplitOrderInfo(
		checkout.code,
		t.context["cookie"]
	);

	t.deepEqual(orders.length, 2);

	for (let order of orders) {
		if (order.products[0].productId == itemHK1.id) {
			t.deepEqual(order.products[0].salePrice, itemHK1.salePrice);
			t.deepEqual(order.paymentSummary.total, itemHK1.salePrice);
		}
		if (order.products[0].productId == itemHK2.id) {
			t.deepEqual(order.products[0].salePrice, itemHK2.salePrice);
			t.deepEqual(order.paymentSummary.total, itemHK2.salePrice);
		}
		t.true(order.code.includes(checkout.code));
		t.regex(order.code, /HKVN-.+-\d/);
		t.true(order.isCrossBorder);
		t.deepEqual(order.paymentSummary.method, "STRIPE");
	}
});

test.serial("POST / split SG and VN order", async t => {
	let itemSG = await requestProduct.getProductWithCountry("SG", 0, 2000000);
	let itemVN = await requestProduct.getProductWithCountry("VN", 0, 2000000);

	await requestCart.addToCart(itemSG.id, t.context["cookie"]);
	await requestCart.addToCart(itemVN.id, t.context["cookie"]);

	checkoutInput.account = await requestAccount.getAccountInfo(
		t.context["cookie"]
	);
	checkoutInput.addresses = addresses;
	checkoutInput.saveNewCard = false;
	checkoutInput.stripeSource = stripeSource;

	let checkout = await request.checkoutStripe(
		checkoutInput,
		t.context["cookie"]
	);
	t.truthy(checkout.orderId);

	let orders = await requestOrder.getSplitOrderInfo(
		checkout.code,
		t.context["cookie"]
	);

	t.deepEqual(orders.length, 2);

	for (let order of orders) {
		if (order.products[0].productId == itemSG.id) {
			t.deepEqual(order.code, `SGVN-${checkout.code}-1`);
			t.true(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemSG.salePrice);
			t.deepEqual(order.paymentSummary.total, itemSG.salePrice);
		}
		if (order.products[0].productId == itemVN.id) {
			t.deepEqual(order.code, `VN-${checkout.code}`);
			t.false(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemVN.salePrice);
			t.deepEqual(order.paymentSummary.total, itemVN.salePrice);
		}
		t.deepEqual(order.paymentSummary.method, "STRIPE");
	}
});

test.serial.skip("POST / split HK and VN order", async t => {
	// skip due to not have HK stock now
	let itemHK = await requestProduct.getProductWithCountry("HK", 0, 2000000);
	let itemVN = await requestProduct.getProductWithCountry("VN", 0, 2000000);

	await requestCart.addToCart(itemHK.id, t.context["cookie"]);
	await requestCart.addToCart(itemVN.id, t.context["cookie"]);

	checkoutInput.account = await requestAccount.getAccountInfo(
		t.context["cookie"]
	);
	checkoutInput.addresses = addresses;
	checkoutInput.saveNewCard = false;
	checkoutInput.stripeSource = stripeSource;

	let checkout = await request.checkoutStripe(
		checkoutInput,
		t.context["cookie"]
	);
	t.truthy(checkout.orderId);

	let orders = await requestOrder.getSplitOrderInfo(
		checkout.code,
		t.context["cookie"]
	);

	t.deepEqual(orders.length, 2);

	for (let order of orders) {
		if (order.products[0].productId == itemHK.id) {
			t.deepEqual(order.code, `HKVN-${checkout.code}-1`);
			t.true(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemHK.salePrice);
			t.deepEqual(order.paymentSummary.total, itemHK.salePrice);
		}
		if (order.products[0].productId == itemVN.id) {
			t.deepEqual(order.code, `VN-${checkout.code}`);
			t.false(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemVN.salePrice);
			t.deepEqual(order.paymentSummary.total, itemVN.salePrice);
		}
		t.deepEqual(order.paymentSummary.method, "STRIPE");
	}
});

test.serial("POST / split multiple SG and VN order", async t => {
	let itemSG1 = await requestProduct.getProductWithCountry("SG", 0, 800000);
	let itemSG2 = await requestProduct.getProductWithCountry(
		"SG",
		900000,
		2000000
	);
	let itemVN1 = await requestProduct.getProductWithCountry("VN", 0, 800000);
	let itemVN2 = await requestProduct.getProductWithCountry("VN", 0, 2000000);

	await requestCart.addToCart(itemSG1.id, t.context["cookie"]);
	await requestCart.addToCart(itemSG2.id, t.context["cookie"]);
	await requestCart.addToCart(itemVN1.id, t.context["cookie"]);
	await requestCart.addToCart(itemVN2.id, t.context["cookie"]);

	checkoutInput.account = await requestAccount.getAccountInfo(
		t.context["cookie"]
	);
	checkoutInput.addresses = addresses;
	checkoutInput.saveNewCard = false;
	checkoutInput.stripeSource = stripeSource;

	let checkout = await request.checkoutStripe(
		checkoutInput,
		t.context["cookie"]
	);
	t.truthy(checkout.orderId);

	let orders = await requestOrder.getSplitOrderInfo(
		checkout.code,
		t.context["cookie"]
	);

	t.deepEqual(orders.length, 3);

	for (let order of orders) {
		if (order.products[0].productId == itemSG1.id) {
			t.regex(order.code, /SGVN-.+-\d/);
			t.true(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemSG1.salePrice);
			t.deepEqual(order.paymentSummary.total, itemSG1.salePrice);
		}
		if (order.products[0].productId == itemSG2.id) {
			t.regex(order.code, /SGVN-.+-\d/);
			t.true(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemSG2.salePrice);
			t.deepEqual(order.paymentSummary.total, itemSG2.salePrice);
		}
		if (
			order.products[0].productId == itemVN1.id ||
			order.products[0].productId == itemVN2.id
		) {
			t.deepEqual(order.code, `VN-${checkout.code}`);
			t.false(order.isCrossBorder);
		}
		t.true(order.code.includes(checkout.code));
		t.deepEqual(order.paymentSummary.method, "STRIPE");
	}
});

test.serial.skip("POST / split multiple HK and VN order", async t => {
	// skip due to not have HK stock now
	let itemHK1 = await requestProduct.getProductWithCountry("HK", 0, 800000);
	let itemHK2 = await requestProduct.getProductWithCountry(
		"HK",
		900000,
		2000000
	);
	let itemVN1 = await requestProduct.getProductWithCountry("VN", 0, 800000);
	let itemVN2 = await requestProduct.getProductWithCountry("VN", 0, 2000000);

	await requestCart.addToCart(itemHK1.id, t.context["cookie"]);
	await requestCart.addToCart(itemHK2.id, t.context["cookie"]);
	await requestCart.addToCart(itemVN1.id, t.context["cookie"]);
	await requestCart.addToCart(itemVN2.id, t.context["cookie"]);

	checkoutInput.account = await requestAccount.getAccountInfo(
		t.context["cookie"]
	);
	checkoutInput.addresses = addresses;
	checkoutInput.saveNewCard = false;
	checkoutInput.stripeSource = stripeSource;

	let checkout = await request.checkoutStripe(
		checkoutInput,
		t.context["cookie"]
	);
	t.truthy(checkout.orderId);

	let orders = await requestOrder.getSplitOrderInfo(
		checkout.code,
		t.context["cookie"]
	);

	t.deepEqual(orders.length, 3);

	for (let order of orders) {
		if (order.products[0].productId == itemHK1.id) {
			t.regex(order.code, /HKVN-.+-\d/);
			t.true(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemHK1.salePrice);
			t.deepEqual(order.paymentSummary.total, itemHK1.salePrice);
		}
		if (order.products[0].productId == itemHK2.id) {
			t.regex(order.code, /HKVN-.+-\d/);
			t.true(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemHK2.salePrice);
			t.deepEqual(order.paymentSummary.total, itemHK2.salePrice);
		}
		if (
			order.products[0].productId == itemVN1.id ||
			order.products[0].productId == itemVN2.id
		) {
			t.deepEqual(order.code, `VN-${checkout.code}`);
			t.false(order.isCrossBorder);
		}
		t.true(order.code.includes(checkout.code));
		t.deepEqual(order.paymentSummary.method, "STRIPE");
	}
});

test.serial.skip("POST / split SG, HK and VN order", async t => {
	// skip due to not have HK stock now
	let itemSG = await requestProduct.getProductWithCountry("SG", 0, 2000000);
	let itemHK = await requestProduct.getProductWithCountry("HK", 0, 2000000);
	let itemVN = await requestProduct.getProductWithCountry("VN", 0, 2000000);

	await requestCart.addToCart(itemSG.id, t.context["cookie"]);
	await requestCart.addToCart(itemHK.id, t.context["cookie"]);
	await requestCart.addToCart(itemVN.id, t.context["cookie"]);

	checkoutInput.account = await requestAccount.getAccountInfo(
		t.context["cookie"]
	);
	checkoutInput.addresses = addresses;
	checkoutInput.saveNewCard = false;
	checkoutInput.stripeSource = stripeSource;

	let checkout = await request.checkoutStripe(
		checkoutInput,
		t.context["cookie"]
	);
	t.truthy(checkout.orderId);

	let orders = await requestOrder.getSplitOrderInfo(
		checkout.code,
		t.context["cookie"]
	);

	t.deepEqual(orders.length, 3);

	for (let order of orders) {
		if (order.products[0].productId == itemSG.id) {
			t.deepEqual(order.code, `SGVN-${checkout.code}-1`);
			t.true(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemSG.salePrice);
			t.deepEqual(order.paymentSummary.total, itemSG.salePrice);
		}
		if (order.products[0].productId == itemHK.id) {
			t.deepEqual(order.code, `HKVN-${checkout.code}-1`);
			t.true(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemHK.salePrice);
			t.deepEqual(order.paymentSummary.total, itemHK.salePrice);
		}
		if (order.products[0].productId == itemVN.id) {
			t.deepEqual(order.code, `VN-${checkout.code}`);
			t.false(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemVN.salePrice);
			t.deepEqual(order.paymentSummary.total, itemVN.salePrice);
		}
		t.deepEqual(order.paymentSummary.method, "STRIPE");
	}
});

test.serial("POST / split SG and VN order - voucher (amount)", async t => {
	const voucher = await access.getNotUsedVoucher(
		{
			expiry: { $gte: new Date() },
			used: false,
			discountType: "amount",
			minimumPurchase: 0,
			numberOfItems: 0,
			oncePerAccount: true,
			customer: { $exists: false }
		},
		customer
	);
	t.truthy(voucher);

	let itemSG = await requestProduct.getProductWithCountry("SG", 0, 2000000);
	let itemVN = await requestProduct.getProductWithCountry("VN", 0, 2000000);

	await requestCart.addToCart(itemSG.id, t.context["cookie"]);
	await requestCart.addToCart(itemVN.id, t.context["cookie"]);

	checkoutInput.account = await requestAccount.getAccountInfo(
		t.context["cookie"]
	);
	checkoutInput.addresses = addresses;
	checkoutInput.voucherId = voucher._id;
	checkoutInput.saveNewCard = false;
	checkoutInput.stripeSource = stripeSource;

	let checkout = await request.checkoutStripe(
		checkoutInput,
		t.context["cookie"]
	);
	t.truthy(checkout.orderId);

	let orders = await requestOrder.getSplitOrderInfo(
		checkout.code,
		t.context["cookie"]
	);

	t.deepEqual(orders.length, 2);

	for (let order of orders) {
		if (order.products[0].productId == itemSG.id) {
			t.deepEqual(order.code, `SGVN-${checkout.code}-1`);
			t.true(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemSG.salePrice);
		}
		if (order.products[0].productId == itemVN.id) {
			t.deepEqual(order.code, `VN-${checkout.code}`);
			t.false(order.isCrossBorder);
			t.deepEqual(order.products[0].salePrice, itemVN.salePrice);
		}
		t.deepEqual(order.paymentSummary.method, "STRIPE");
	}

	t.deepEqual(
		orders[0].paymentSummary.voucherAmount +
			orders[1].paymentSummary.voucherAmount,
		voucher.amount
	);
});

test.serial(
	"POST / split SG order when total >= 1,000,000 - voucher (percentage + max discount)",
	async t => {
		const voucher = await access.getVoucher({
			expiry: { $gte: new Date() },
			used: false,
			binRange: "433590,542288,555555,400000",
			discountType: "percentage",
			maximumDiscountAmount: { $gt: 0 },
			specificDays: []
		});
		t.truthy(voucher);

		let itemSG1 = await requestProduct.getProductWithCountry(
			"SG",
			500000,
			700000
		);
		let itemSG2 = await requestProduct.getProductWithCountry(
			"SG",
			800000,
			1000000
		);
		let itemSG3 = await requestProduct.getProductWithCountry(
			"SG",
			1100000,
			2000000
		);

		await requestCart.addToCart(itemSG1.id, t.context["cookie"]);
		await requestCart.addToCart(itemSG2.id, t.context["cookie"]);
		await requestCart.addToCart(itemSG3.id, t.context["cookie"]);

		checkoutInput.account = await requestAccount.getAccountInfo(
			t.context["cookie"]
		);
		checkoutInput.addresses = addresses;
		checkoutInput.voucherId = voucher._id;
		checkoutInput.saveNewCard = false;
		checkoutInput.stripeSource = stripeSource;

		let checkout = await request.checkoutStripe(
			checkoutInput,
			t.context["cookie"]
		);
		t.truthy(checkout.orderId);

		let orders = await requestOrder.getSplitOrderInfo(
			checkout.code,
			t.context["cookie"]
		);

		t.deepEqual(orders.length, 3);

		for (let order of orders) {
			if (order.products[0].productId == itemSG1.id) {
				t.deepEqual(order.products[0].salePrice, itemSG1.salePrice);
			}
			if (order.products[0].productId == itemSG2.id) {
				t.deepEqual(order.products[0].salePrice, itemSG2.salePrice);
			}
			if (order.products[0].productId == itemSG3.id) {
				t.deepEqual(order.products[0].salePrice, itemSG3.salePrice);
			}
			t.true(order.code.includes(checkout.code));
			t.regex(order.code, /SGVN-.+-\d/);
			t.true(order.isCrossBorder);
			t.deepEqual(order.paymentSummary.method, "STRIPE");
		}

		t.true(
			orders[0].paymentSummary.voucherAmount +
				orders[1].paymentSummary.voucherAmount +
				orders[2].paymentSummary.voucherAmount <=
				voucher.maximumDiscountAmount
		);
	}
);
