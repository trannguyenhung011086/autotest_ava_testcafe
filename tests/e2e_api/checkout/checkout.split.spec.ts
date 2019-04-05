import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let customer: Model.Customer;
let addresses: Model.Addresses;
const checkoutInput: Model.CheckoutInput = {};

const request = new Utils.CheckoutUtils();
const requestAddress = new Utils.AddressUtils();
const requestAccount = new Utils.AccountUtils();
const requestCart = new Utils.CartUtils();
const requestProduct = new Utils.ProductUtils();
const requestOrder = new Utils.OrderUtils();
const access = new Utils.DbAccessUtils();

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
    customer = await access.getCustomerInfo({
        email: config.testAccount.email_ex[10].toLowerCase()
    });
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

test.serial("Not split SG order when total < 1,000,000", async t => {
    const itemSG1 = await requestProduct.getProductWithCountry("SG", 0, 400000);
    const itemSG2 = await requestProduct.getProductWithCountry(
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

    const checkout = await request.checkoutStripe(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const order = await requestOrder.getOrderInfo(
        checkout.code,
        t.context["cookie"]
    );

    t.false(Array.isArray(order));
    t.deepEqual(order.code, `SGVN-${checkout.code}-1`);
    t.deepEqual(order.paymentSummary.method, "STRIPE");

    for (const product of order.products) {
        if (product.productId == itemSG1.id) {
            t.deepEqual(product.salePrice, itemSG1.salePrice);
        }
        if (product.productId == itemSG2.id) {
            t.deepEqual(product.salePrice, itemSG2.salePrice);
        }
    }
});

test.serial.skip("Not split HK order when total < 1,000,000", async t => {
    // skip due to not have HK stock now
    const itemHK1 = await requestProduct.getProductWithCountry("HK", 0, 400000);
    const itemHK2 = await requestProduct.getProductWithCountry(
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

    const checkout = await request.checkoutStripe(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const order = await requestOrder.getOrderInfo(
        checkout.code,
        t.context["cookie"]
    );

    t.false(Array.isArray(order));
    t.deepEqual(order.code, `SGVN-${checkout.code}-1`);
    t.deepEqual(order.paymentSummary.method, "STRIPE");

    for (const product of order.products) {
        if (product.productId == itemHK1.id) {
            t.deepEqual(product.salePrice, itemHK1.salePrice);
        }
        if (product.productId == itemHK2.id) {
            t.deepEqual(product.salePrice, itemHK2.salePrice);
        }
    }
});

test.serial("Split SG order when total >= 1,000,000", async t => {
    const itemSG1 = await requestProduct.getProductWithCountry("SG", 0, 800000);
    const itemSG2 = await requestProduct.getProductWithCountry(
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

    const checkout = await request.checkoutStripe(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const orders = await requestOrder.getSplitOrderInfo(
        checkout.code,
        t.context["cookie"]
    );

    t.deepEqual(orders.length, 2);

    for (const order of orders) {
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
        t.deepEqual(order.paymentSummary.method, "STRIPE");
    }
});

test.serial.skip("POST / split HK order when total >= 1,000,000", async t => {
    // skip due to not have HK stock now
    const itemHK1 = await requestProduct.getProductWithCountry("HK", 0, 800000);
    const itemHK2 = await requestProduct.getProductWithCountry(
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

    const checkout = await request.checkoutStripe(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const orders = await requestOrder.getSplitOrderInfo(
        checkout.code,
        t.context["cookie"]
    );

    t.deepEqual(orders.length, 2);

    for (const order of orders) {
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
        t.deepEqual(order.paymentSummary.method, "STRIPE");
    }
});

test.serial("POST / split SG and VN order", async t => {
    const itemSG = await requestProduct.getProductWithCountry("SG", 0, 2000000);
    const itemVN = await requestProduct.getProductWithCountry("VN", 0, 2000000);

    await requestCart.addToCart(itemSG.id, t.context["cookie"]);
    await requestCart.addToCart(itemVN.id, t.context["cookie"]);

    checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
    );
    checkoutInput.addresses = addresses;
    checkoutInput.saveNewCard = false;
    checkoutInput.stripeSource = stripeSource;

    const checkout = await request.checkoutStripe(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const orders = await requestOrder.getSplitOrderInfo(
        checkout.code,
        t.context["cookie"]
    );

    t.deepEqual(orders.length, 2);

    for (const order of orders) {
        if (order.products[0].productId == itemSG.id) {
            t.deepEqual(order.code, `SGVN-${checkout.code}-1`);
            t.deepEqual(order.products[0].salePrice, itemSG.salePrice);
            t.deepEqual(order.paymentSummary.total, itemSG.salePrice);
        }
        if (order.products[0].productId == itemVN.id) {
            t.deepEqual(order.code, `VN-${checkout.code}`);
            t.deepEqual(order.products[0].salePrice, itemVN.salePrice);
            t.deepEqual(order.paymentSummary.total, itemVN.salePrice);
        }
        t.deepEqual(order.paymentSummary.method, "STRIPE");
    }
});

test.serial.skip("POST / split HK and VN order", async t => {
    // skip due to not have HK stock now
    const itemHK = await requestProduct.getProductWithCountry("HK", 0, 2000000);
    const itemVN = await requestProduct.getProductWithCountry("VN", 0, 2000000);

    await requestCart.addToCart(itemHK.id, t.context["cookie"]);
    await requestCart.addToCart(itemVN.id, t.context["cookie"]);

    checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
    );
    checkoutInput.addresses = addresses;
    checkoutInput.saveNewCard = false;
    checkoutInput.stripeSource = stripeSource;

    const checkout = await request.checkoutStripe(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const orders = await requestOrder.getSplitOrderInfo(
        checkout.code,
        t.context["cookie"]
    );

    t.deepEqual(orders.length, 2);

    for (const order of orders) {
        if (order.products[0].productId == itemHK.id) {
            t.deepEqual(order.code, `HKVN-${checkout.code}-1`);
            t.deepEqual(order.products[0].salePrice, itemHK.salePrice);
            t.deepEqual(order.paymentSummary.total, itemHK.salePrice);
        }
        if (order.products[0].productId == itemVN.id) {
            t.deepEqual(order.code, `VN-${checkout.code}`);
            t.deepEqual(order.products[0].salePrice, itemVN.salePrice);
            t.deepEqual(order.paymentSummary.total, itemVN.salePrice);
        }
        t.deepEqual(order.paymentSummary.method, "STRIPE");
    }
});

test.serial("POST / split multiple SG and VN order", async t => {
    const itemSG1 = await requestProduct.getProductWithCountry("SG", 0, 800000);
    const itemSG2 = await requestProduct.getProductWithCountry(
        "SG",
        900000,
        2000000
    );
    const itemVN1 = await requestProduct.getProductWithCountry("VN", 0, 800000);
    const itemVN2 = await requestProduct.getProductWithCountry(
        "VN",
        0,
        2000000
    );

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

    const checkout = await request.checkoutStripe(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const orders = await requestOrder.getSplitOrderInfo(
        checkout.code,
        t.context["cookie"]
    );

    t.deepEqual(orders.length, 3);

    for (const order of orders) {
        if (order.products[0].productId == itemSG1.id) {
            t.regex(order.code, /SGVN-.+-\d/);
            t.deepEqual(order.products[0].salePrice, itemSG1.salePrice);
            t.deepEqual(order.paymentSummary.total, itemSG1.salePrice);
        }
        if (order.products[0].productId == itemSG2.id) {
            t.regex(order.code, /SGVN-.+-\d/);
            t.deepEqual(order.products[0].salePrice, itemSG2.salePrice);
            t.deepEqual(order.paymentSummary.total, itemSG2.salePrice);
        }
        if (
            order.products[0].productId == itemVN1.id ||
            order.products[0].productId == itemVN2.id
        ) {
            t.deepEqual(order.code, `VN-${checkout.code}`);
        }
        t.true(order.code.includes(checkout.code));
        t.deepEqual(order.paymentSummary.method, "STRIPE");
    }
});

test.serial.skip("POST / split multiple HK and VN order", async t => {
    // skip due to not have HK stock now
    const itemHK1 = await requestProduct.getProductWithCountry("HK", 0, 800000);
    const itemHK2 = await requestProduct.getProductWithCountry(
        "HK",
        900000,
        2000000
    );
    const itemVN1 = await requestProduct.getProductWithCountry("VN", 0, 800000);
    const itemVN2 = await requestProduct.getProductWithCountry(
        "VN",
        0,
        2000000
    );

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

    const checkout = await request.checkoutStripe(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const orders = await requestOrder.getSplitOrderInfo(
        checkout.code,
        t.context["cookie"]
    );

    t.deepEqual(orders.length, 3);

    for (const order of orders) {
        if (order.products[0].productId == itemHK1.id) {
            t.regex(order.code, /HKVN-.+-\d/);
            t.deepEqual(order.products[0].salePrice, itemHK1.salePrice);
            t.deepEqual(order.paymentSummary.total, itemHK1.salePrice);
        }
        if (order.products[0].productId == itemHK2.id) {
            t.regex(order.code, /HKVN-.+-\d/);
            t.deepEqual(order.products[0].salePrice, itemHK2.salePrice);
            t.deepEqual(order.paymentSummary.total, itemHK2.salePrice);
        }
        if (
            order.products[0].productId == itemVN1.id ||
            order.products[0].productId == itemVN2.id
        ) {
            t.deepEqual(order.code, `VN-${checkout.code}`);
        }
        t.true(order.code.includes(checkout.code));
        t.deepEqual(order.paymentSummary.method, "STRIPE");
    }
});

test.serial.skip("POST / split SG, HK and VN order", async t => {
    // skip due to not have HK stock now
    const itemSG = await requestProduct.getProductWithCountry("SG", 0, 2000000);
    const itemHK = await requestProduct.getProductWithCountry("HK", 0, 2000000);
    const itemVN = await requestProduct.getProductWithCountry("VN", 0, 2000000);

    await requestCart.addToCart(itemSG.id, t.context["cookie"]);
    await requestCart.addToCart(itemHK.id, t.context["cookie"]);
    await requestCart.addToCart(itemVN.id, t.context["cookie"]);

    checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
    );
    checkoutInput.addresses = addresses;
    checkoutInput.saveNewCard = false;
    checkoutInput.stripeSource = stripeSource;

    const checkout = await request.checkoutStripe(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const orders = await requestOrder.getSplitOrderInfo(
        checkout.code,
        t.context["cookie"]
    );

    t.deepEqual(orders.length, 3);

    for (const order of orders) {
        if (order.products[0].productId == itemSG.id) {
            t.deepEqual(order.code, `SGVN-${checkout.code}-1`);
            t.deepEqual(order.products[0].salePrice, itemSG.salePrice);
            t.deepEqual(order.paymentSummary.total, itemSG.salePrice);
        }
        if (order.products[0].productId == itemHK.id) {
            t.deepEqual(order.code, `HKVN-${checkout.code}-1`);
            t.deepEqual(order.products[0].salePrice, itemHK.salePrice);
            t.deepEqual(order.paymentSummary.total, itemHK.salePrice);
        }
        if (order.products[0].productId == itemVN.id) {
            t.deepEqual(order.code, `VN-${checkout.code}`);
            t.deepEqual(order.products[0].salePrice, itemVN.salePrice);
            t.deepEqual(order.paymentSummary.total, itemVN.salePrice);
        }
        t.deepEqual(order.paymentSummary.method, "STRIPE");
    }
});

test.serial("POST / split SG and VN order - voucher (amount)", async t => {
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        discountType: "amount",
        minimumPurchase: 0,
        numberOfItems: 0,
        multipleUser: true,
        oncePerAccount: false
    });
    t.truthy(voucher);

    const itemSG = await requestProduct.getProductWithCountry("SG", 0, 2000000);
    const itemVN = await requestProduct.getProductWithCountry("VN", 0, 2000000);

    await requestCart.addToCart(itemSG.id, t.context["cookie"]);
    await requestCart.addToCart(itemVN.id, t.context["cookie"]);

    checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
    );
    checkoutInput.addresses = addresses;
    checkoutInput.voucherId = voucher._id;
    checkoutInput.saveNewCard = false;
    checkoutInput.stripeSource = stripeSource;

    const checkout = await request.checkoutStripe(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(checkout.orderId);

    const orders = await requestOrder.getSplitOrderInfo(
        checkout.code,
        t.context["cookie"]
    );

    t.deepEqual(orders.length, 2);

    for (const order of orders) {
        if (order.products[0].productId == itemSG.id) {
            t.deepEqual(order.code, `SGVN-${checkout.code}-1`);
            t.deepEqual(order.products[0].salePrice, itemSG.salePrice);
        }
        if (order.products[0].productId == itemVN.id) {
            t.deepEqual(order.code, `VN-${checkout.code}`);
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
            binRange: "433590,542288,555555,400000,4111",
            discountType: "percentage",
            maximumDiscountAmount: { $gt: 0 },
            multipleUser: true,
            oncePerAccount: false
        });
        t.truthy(voucher);

        const itemSG1 = await requestProduct.getProductWithCountry(
            "SG",
            500000,
            700000
        );
        const itemSG2 = await requestProduct.getProductWithCountry(
            "SG",
            800000,
            1000000
        );
        const itemSG3 = await requestProduct.getProductWithCountry(
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

        const checkout = await request.checkoutStripe(
            checkoutInput,
            t.context["cookie"]
        );
        t.truthy(checkout.orderId);

        const orders = await requestOrder.getSplitOrderInfo(
            checkout.code,
            t.context["cookie"]
        );

        t.deepEqual(orders.length, 3);

        for (const order of orders) {
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
