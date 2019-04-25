import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let addresses: Model.Addresses;
const checkoutInput: Model.CheckoutInput = {};

const request = new Utils.CheckoutUtils();
const requestAddress = new Utils.AddressUtils();
const requestAccount = new Utils.AccountUtils();
const requestCart = new Utils.CartUtils();
const requestProduct = new Utils.ProductUtils();
const requestOrder = new Utils.OrderUtils();
const requestCreditcard = new Utils.CreditCardUtils();
const access = new Utils.DbAccessUtils();

const stripeData = {
    type: "card",
    "card[cvc]": "222",
    "card[exp_month]": "02",
    "card[exp_year]": "22",
    key: config.stripeKey
};

import test from "ava";

test.before(async t => {
    t.context["cookie"] = await request.getLogInCookie(
        config.testAccount.email_ex[11],
        config.testAccount.password_ex
    );

    addresses = await requestAddress.getAddresses(t.context["cookie"]);
});

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context["cookie"]);
});

test.serial(
    "Get 500 error code when checkout with declined Stripe",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.internationalSales,
            1
        );
        await requestCart.addToCart(item.id, t.context["cookie"]);

        const account = await requestAccount.getAccountInfo(
            t.context["cookie"]
        );

        stripeData["card[number]"] = "4000000000000002";
        const stripeSource = await request
            .postFormUrl(
                "/v1/sources",
                stripeData,
                t.context["cookie"],
                config.stripeBase
            )
            .then(res => res.body);

        const res = await request.post(
            config.api.checkout,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: account.cart,
                method: "STRIPE",
                methodData: stripeSource
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 500);
        t.deepEqual(res.body.message, "STRIPE_CUSTOMER_ERROR");
        t.deepEqual(res.body.error.type, "StripeCardError");
        t.deepEqual(res.body.error.code, "card_declined");
        t.deepEqual(res.body.error.message, "Your card was declined.");
    }
);

test.serial(
    "Get 500 error code when checkout with unsupported Stripe",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.internationalSales,
            1
        );
        await requestCart.addToCart(item.id, t.context["cookie"]);

        const account = await requestAccount.getAccountInfo(
            t.context["cookie"]
        );

        stripeData["card[number]"] = "3566002020360505"; // JCB
        const stripeSource = await request
            .postFormUrl(
                "/v1/sources",
                stripeData,
                t.context["cookie"],
                config.stripeBase
            )
            .then(res => res.body);

        t.truthy(stripeSource["error"]["code"], "card_declined");

        const res = await request.post(
            config.api.checkout,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: account.cart,
                method: "STRIPE",
                methodData: stripeSource
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 500);
        t.deepEqual(res.body.message, "STRIPE_CUSTOMER_ERROR");
        t.deepEqual(res.body.error.type, "StripeInvalidRequestError");
        t.deepEqual(res.body.error.code, "parameter_missing");
        t.deepEqual(res.body.error.message, "Missing required param: source.");
    }
);

test.serial(
    "Order status is Placed when checkout with new Stripe (not save card) - VISA",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const item = await requestProduct.getInStockProduct(
                config.api.internationalSales,
                1
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);

            stripeData["card[number]"] = "4000000000000077";

            checkoutInput.account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );
            checkoutInput.addresses = addresses;
            checkoutInput.saveNewCard = false;
            checkoutInput.stripeSource = await request
                .postFormUrl(
                    "/v1/sources",
                    stripeData,
                    t.context["cookie"],
                    config.stripeBase
                )
                .then(res => res.body);

            const checkout = await request.checkoutStripe(
                checkoutInput,
                t.context["cookie"]
            );
            t.truthy(checkout.orderId);

            const order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.true(order.code.includes(checkout.code));
            t.deepEqual(order.status, "placed");
            t.deepEqual(order.paymentSummary.method, "STRIPE");
            t.deepEqual(order.paymentSummary.shipping, 0);
        }
    }
);

test.serial(
    "Order status is Placed when checkout with new Stripe (not save card) - MASTER",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const item = await requestProduct.getInStockProduct(
                config.api.internationalSales,
                1
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);

            stripeData["card[number]"] = "5555555555554444";

            checkoutInput.account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );
            checkoutInput.addresses = addresses;
            checkoutInput.saveNewCard = false;
            checkoutInput.stripeSource = await request
                .postFormUrl(
                    "/v1/sources",
                    stripeData,
                    t.context["cookie"],
                    config.stripeBase
                )
                .then(res => res.body);

            const checkout = await request.checkoutStripe(
                checkoutInput,
                t.context["cookie"]
            );
            t.truthy(checkout.orderId);

            const order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.true(order.code.includes(checkout.code));
            t.deepEqual(order.status, "placed");
            t.deepEqual(order.paymentSummary.method, "STRIPE");
            t.deepEqual(order.paymentSummary.shipping, 0);
        }
    }
);

test.serial(
    "Order status is Placed when checkout with new Stripe (save card) - VISA",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const item = await requestProduct.getInStockProduct(
                config.api.internationalSales,
                1
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);

            stripeData["card[number]"] = "4000000000000077";

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

            const checkout = await request.checkoutStripe(
                checkoutInput,
                t.context["cookie"]
            );
            t.truthy(checkout.orderId);

            const order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.true(order.code.includes(checkout.code));
            t.deepEqual(order.status, "placed");
            t.deepEqual(order.paymentSummary.method, "STRIPE");
            t.deepEqual(order.paymentSummary.shipping, 0);
        }
    }
);

test.serial(
    "Order status is Placed when checkout with saved Stripe",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const matchedCard = await requestCreditcard.getCard(
                "Stripe",
                t.context["cookie"]
            );

            const item = await requestProduct.getInStockProduct(
                config.api.internationalSales,
                1
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);

            checkoutInput.account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );
            checkoutInput.addresses = addresses;
            checkoutInput.methodData = matchedCard;

            const checkout = await request.checkoutStripe(
                checkoutInput,
                t.context["cookie"]
            );
            t.truthy(checkout.orderId);

            const order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.true(order.code.includes(checkout.code));
            t.deepEqual(order.status, "placed");
            t.deepEqual(order.paymentSummary.method, "STRIPE");
            t.deepEqual(order.paymentSummary.shipping, 0);
        }
    }
);

test.serial(
    "Order status is Placed when checkout with new Stripe (save card) - MASTER - voucher (amount) + credit",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const voucher = await access.getVoucher({
                expiry: { $gte: new Date() },
                binRange: "433590,542288,555555,400000,4111",
                discountType: "amount",
                multipleUser: true,
                oncePerAccount: false
            });
            t.truthy(voucher);

            const item = await requestProduct.getInStockProduct(
                config.api.internationalSales,
                2
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);

            const account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );

            const credit = request.calculateCredit(
                account.accountCredit,
                item.salePrice,
                voucher.amount
            );

            stripeData["card[number]"] = "5555555555554444";

            checkoutInput.account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );
            checkoutInput.addresses = addresses;
            checkoutInput.voucherId = voucher._id;
            checkoutInput.credit = credit;
            checkoutInput.saveNewCard = true;
            checkoutInput.stripeSource = await request
                .postFormUrl(
                    "/v1/sources",
                    stripeData,
                    t.context["cookie"],
                    config.stripeBase
                )
                .then(res => res.body);

            const checkout = await request.checkoutStripe(
                checkoutInput,
                t.context["cookie"]
            );
            t.truthy(checkout.orderId);

            const order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.true(order.code.includes(checkout.code));
            t.deepEqual(order.status, "placed");
            t.deepEqual(order.paymentSummary.method, "STRIPE");
            t.deepEqual(order.paymentSummary.shipping, 0);
            t.deepEqual(order.paymentSummary.voucherAmount, voucher.amount);
            t.deepEqual(Math.abs(order.paymentSummary.accountCredit), credit);
        }
    }
);

test.serial(
    "Order status is Placed when checkout with saved Stripe - voucher (percentage + max discount)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const voucher = await access.getVoucher({
                expiry: { $gte: new Date() },
                binRange: "433590,542288,555555,400000,4111",
                discountType: "percentage",
                maximumDiscountAmount: { $gt: 0 },
                multipleUser: true,
                oncePerAccount: false
            });
            t.truthy(voucher);

            const matchedCard = await requestCreditcard.getCard(
                "Stripe",
                t.context["cookie"]
            );

            const item = await requestProduct.getInStockProduct(
                config.api.internationalSales,
                1
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);

            checkoutInput.account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );
            checkoutInput.addresses = addresses;
            checkoutInput.voucherId = voucher._id;
            checkoutInput.methodData = matchedCard;

            const checkout = await request.checkoutStripe(
                checkoutInput,
                t.context["cookie"]
            );
            t.truthy(checkout.orderId);

            const order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.true(order.code.includes(checkout.code));
            t.deepEqual(order.status, "placed");
            t.deepEqual(order.paymentSummary.method, "STRIPE");
            t.deepEqual(order.paymentSummary.shipping, 0);
            t.true(
                order.paymentSummary.voucherAmount <=
                    voucher.maximumDiscountAmount
            );
        }
    }
);
