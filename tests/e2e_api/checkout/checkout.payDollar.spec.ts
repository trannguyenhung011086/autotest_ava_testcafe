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

import test from "ava";

test.before(async t => {
    t.context["cookie"] = await request.getLogInCookie(
        config.testAccount.email_ex[6],
        config.testAccount.password_ex
    );

    addresses = await requestAddress.getAddresses(t.context["cookie"]);
});

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context["cookie"]);
});

test.serial(
    "Get 400 error code when checkout with CC - international product",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.internationalSales,
            1
        );

        await requestCart.addToCart(item.id, t.context["cookie"]);
        const account = await requestAccount.getAccountInfo(
            t.context["cookie"]
        );

        const res = await request.post(
            config.api.checkout,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: account.cart,
                method: "CC",
                saveCard: true,
                shipping: 0,
                accountCredit: 0
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(
            res.body.message,
            "International orders must be paid by credit card. Please refresh the page and try again."
        );
    }
);

test.serial("Order status is Failed when checkout with invalid CC", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.todaySales,
        1
    );
    await requestCart.addToCart(item.id, t.context["cookie"]);

    checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
    );
    checkoutInput.addresses = addresses;

    const checkout = await request.checkoutPayDollar(
        checkoutInput,
        t.context["cookie"]
    );

    t.truthy(checkout.orderId);

    const payDollarCreditCard: Model.PayDollarCreditCard = checkout.creditCard;
    payDollarCreditCard.cardHolder = "test";
    payDollarCreditCard.cardNo = "4111111111111111";
    payDollarCreditCard.pMethod = "VISA";
    payDollarCreditCard.epMonth = 7;
    payDollarCreditCard.epYear = 2020;
    payDollarCreditCard.securityCode = "123";

    const result = await request.postFormUrlPlain(
        config.payDollarApi,
        payDollarCreditCard,
        t.context["cookie"],
        config.payDollarBase
    );
    const parse = await request.parsePayDollarRes(result.body);

    t.deepEqual(parse.successcode, "1");
    t.regex(parse.errMsg, /Transaction failed/);

    const order = await requestOrder.getOrderInfo(
        checkout.orderId,
        t.context["cookie"]
    );

    t.deepEqual(order.status, "failed");
});

test.serial(
    "Order status is Pending when checkout with non-supported CC - JCB",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
            1
        );
        await requestCart.addToCart(item.id, t.context["cookie"]);

        checkoutInput.account = await requestAccount.getAccountInfo(
            t.context["cookie"]
        );
        checkoutInput.addresses = addresses;

        const checkout = await request.checkoutPayDollar(
            checkoutInput,
            t.context["cookie"]
        );

        t.truthy(checkout.orderId);

        const payDollarCreditCard: Model.PayDollarCreditCard =
            checkout.creditCard;
        payDollarCreditCard.cardHolder = "testing card";
        payDollarCreditCard.cardNo = "3566002020360505";
        payDollarCreditCard.pMethod = "JCB";
        payDollarCreditCard.epMonth = 7;
        payDollarCreditCard.epYear = 2020;
        payDollarCreditCard.securityCode = "123";

        const result = await request.postFormUrlPlain(
            config.payDollarApi,
            payDollarCreditCard,
            t.context["cookie"],
            config.payDollarBase
        );
        const parse = await request.parsePayDollarRes(result.body);

        t.deepEqual(parse.successcode, "-1");
        t.falsy(parse.Ref);
        t.regex(
            parse.errMsg,
            /Your account doesn\'t support the payment method \(JCB\)/
        );

        const order = await requestOrder.getOrderInfo(
            checkout.orderId,
            t.context["cookie"]
        );

        t.deepEqual(order.status, "pending");
    }
);

test.serial(
    "Order status is Pending when checkout with non-supported CC - AMEX",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
            1
        );
        await requestCart.addToCart(item.id, t.context["cookie"]);

        checkoutInput.account = await requestAccount.getAccountInfo(
            t.context["cookie"]
        );
        checkoutInput.addresses = addresses;

        const checkout = await request.checkoutPayDollar(
            checkoutInput,
            t.context["cookie"]
        );

        t.truthy(checkout.orderId);

        const payDollarCreditCard: Model.PayDollarCreditCard =
            checkout.creditCard;
        payDollarCreditCard.cardHolder = "testing card";
        payDollarCreditCard.cardNo = "378282246310005";
        payDollarCreditCard.pMethod = "AMEX";
        payDollarCreditCard.epMonth = 7;
        payDollarCreditCard.epYear = 2020;
        payDollarCreditCard.securityCode = "123";

        const result = await request.postFormUrlPlain(
            config.payDollarApi,
            payDollarCreditCard,
            t.context["cookie"],
            config.payDollarBase
        );
        const parse = await request.parsePayDollarRes(result.body);

        t.deepEqual(parse.successcode, "-1");
        t.falsy(parse.Ref);
        t.regex(
            parse.errMsg,
            /Your account doesn\'t support the payment method \(AMEX\)/
        );

        const order = await requestOrder.getOrderInfo(
            checkout.orderId,
            t.context["cookie"]
        );

        t.deepEqual(order.status, "pending");
    }
);

test.serial(
    "Order status is Placed when checkout with new CC (not save card) - VISA",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const item = await requestProduct.getInStockProduct(
                config.api.todaySales,
                1
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);

            checkoutInput.account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );
            checkoutInput.addresses = addresses;
            checkoutInput.saveNewCard = false;

            const checkout = await request.checkoutPayDollar(
                checkoutInput,
                t.context["cookie"]
            );

            t.truthy(checkout.orderId);

            let order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.true(checkout.creditCard.orderRef.includes(order.code));
            t.deepEqual(order.status, "pending");
            t.deepEqual(order.paymentSummary.method, "CC");
            t.deepEqual(order.paymentSummary.shipping, 0);

            const payDollarCreditCard: Model.PayDollarCreditCard =
                checkout.creditCard;
            payDollarCreditCard.cardHolder = "testing card";
            payDollarCreditCard.cardNo = "4335900000140045";
            payDollarCreditCard.pMethod = "VISA";
            payDollarCreditCard.epMonth = 7;
            payDollarCreditCard.epYear = 2020;
            payDollarCreditCard.securityCode = "123";

            const result = await request.postFormUrlPlain(
                config.payDollarApi,
                payDollarCreditCard,
                t.context["cookie"],
                config.payDollarBase
            );
            const parse = await request.parsePayDollarRes(result.body);

            t.deepEqual(parse.successcode, "0");
            t.deepEqual(parse.Ref, checkout.creditCard.orderRef);
            t.regex(parse.errMsg, /Transaction completed/);

            order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.deepEqual(order.status, "placed");
        }
    }
);

test.serial(
    "Order status is Placed when checkout with new CC (not save card) - MASTER",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const item = await requestProduct.getInStockProduct(
                config.api.todaySales,
                1
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);

            checkoutInput.account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );
            checkoutInput.addresses = addresses;
            checkoutInput.saveNewCard = false;

            const checkout = await request.checkoutPayDollar(
                checkoutInput,
                t.context["cookie"]
            );

            t.truthy(checkout.orderId);

            let order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.true(checkout.creditCard.orderRef.includes(order.code));
            t.deepEqual(order.status, "pending");
            t.deepEqual(order.paymentSummary.method, "CC");
            t.deepEqual(order.paymentSummary.shipping, 0);

            const payDollarCreditCard: Model.PayDollarCreditCard =
                checkout.creditCard;
            payDollarCreditCard.cardHolder = "testing card";
            payDollarCreditCard.cardNo = "5422882800700007";
            payDollarCreditCard.pMethod = "Master";
            payDollarCreditCard.epMonth = 7;
            payDollarCreditCard.epYear = 2020;
            payDollarCreditCard.securityCode = "123";

            const result = await request.postFormUrlPlain(
                config.payDollarApi,
                payDollarCreditCard,
                t.context["cookie"],
                config.payDollarBase
            );
            const parse = await request.parsePayDollarRes(result.body);

            t.deepEqual(parse.successcode, "0");
            t.deepEqual(parse.Ref, checkout.creditCard.orderRef);
            t.regex(parse.errMsg, /Transaction completed/);

            order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.deepEqual(order.status, "placed");
        }
    }
);

test.serial(
    "Order status is Placed when checkout with new CC (save card) - MASTER",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const item = await requestProduct.getInStockProduct(
                config.api.todaySales,
                1
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);

            checkoutInput.account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );
            checkoutInput.addresses = addresses;
            checkoutInput.saveNewCard = true;

            const checkout = await request.checkoutPayDollar(
                checkoutInput,
                t.context["cookie"]
            );

            t.truthy(checkout.orderId);

            let order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.true(checkout.creditCard.orderRef.includes(order.code));
            t.deepEqual(order.status, "pending");
            t.deepEqual(order.paymentSummary.method, "CC");
            t.deepEqual(order.paymentSummary.shipping, 0);

            const payDollarCreditCard: Model.PayDollarCreditCard =
                checkout.creditCard;
            payDollarCreditCard.cardHolder = "testing card";
            payDollarCreditCard.cardNo = "5422882800700007";
            payDollarCreditCard.pMethod = "Master";
            payDollarCreditCard.epMonth = 7;
            payDollarCreditCard.epYear = 2020;
            payDollarCreditCard.securityCode = "123";

            const result = await request.postFormUrlPlain(
                config.payDollarApi,
                payDollarCreditCard,
                t.context["cookie"],
                config.payDollarBase
            );
            const parse = await request.parsePayDollarRes(result.body);

            t.deepEqual(parse.successcode, "0");
            t.deepEqual(parse.Ref, checkout.creditCard.orderRef);
            t.regex(parse.errMsg, /Transaction completed/);

            order = await requestOrder.getOrderInfo(
                checkout.orderId,
                t.context["cookie"]
            );

            t.deepEqual(order.status, "placed");
        }
    }
);

test.serial("Order status is Placed when checkout with saved CC", async t => {
    if (process.env.NODE_ENV == "prod") {
        t.log("Skip checkout on prod!");
        t.pass();
    } else {
        const matchedCard = await requestCreditcard.getCard(
            "PayDollar",
            t.context["cookie"]
        );

        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
            1
        );
        await requestCart.addToCart(item.id, t.context["cookie"]);

        checkoutInput.account = await requestAccount.getAccountInfo(
            t.context["cookie"]
        );
        checkoutInput.addresses = addresses;
        checkoutInput.methodData = matchedCard;

        const checkout = await request.checkoutPayDollar(
            checkoutInput,
            t.context["cookie"]
        );

        t.truthy(checkout.orderId);

        let order = await requestOrder.getOrderInfo(
            checkout.orderId,
            t.context["cookie"]
        );

        t.true(checkout.creditCard.orderRef.includes(order.code));
        t.deepEqual(order.status, "pending");
        t.deepEqual(order.paymentSummary.method, "CC");
        t.deepEqual(order.paymentSummary.shipping, 0);

        const payDollarCreditCard: Model.PayDollarCreditCard =
            checkout.creditCard;
        const result = await request.postFormUrlPlain(
            config.payDollarApi,
            payDollarCreditCard,
            t.context["cookie"],
            config.payDollarBase
        );
        const parse = await request.parsePayDollarRes(result.body);

        t.deepEqual(parse.successcode, "0");
        t.deepEqual(parse.Ref, checkout.creditCard.orderRef);
        t.regex(parse.errMsg, /Transaction completed/);

        order = await requestOrder.getOrderInfo(
            checkout.orderId,
            t.context["cookie"]
        );

        t.deepEqual(order.status, "placed");
    }
});

test.serial(
    "Order status is Placed when checkout with new CC (save card) - VISA - voucher (amount) + credit",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const voucher = await access.getVoucher({
                expiry: { $gte: new Date() },
                binRange: "433590,542288,555555,400000,4111",
                discountType: "amount",
                numberOfUsage: 0,
                multipleUser: true,
                oncePerAccount: false
            });

            t.truthy(voucher);

            const cookie = await request.getLogInCookie(
                config.testAccount.email_ex[9],
                config.testAccount.password_ex
            );

            const item = await requestProduct.getInStockProduct(
                config.api.todaySales,
                2
            );

            const account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );

            const credit = request.calculateCredit(
                account.accountCredit,
                item.salePrice,
                voucher.amount
            );

            await requestCart.addToCart(item.id, cookie);

            checkoutInput.account = await requestAccount.getAccountInfo(cookie);
            checkoutInput.addresses = addresses;
            checkoutInput.voucherId = voucher._id;
            checkoutInput.credit = credit;
            checkoutInput.saveNewCard = true;

            const checkout = await request.checkoutPayDollar(
                checkoutInput,
                cookie
            );

            t.truthy(checkout.orderId);

            let order = await requestOrder.getOrderInfo(
                checkout.orderId,
                cookie
            );

            t.true(checkout.creditCard.orderRef.includes(order.code));
            t.deepEqual(order.status, "pending");
            t.deepEqual(order.paymentSummary.method, "CC");
            t.deepEqual(order.paymentSummary.shipping, 0);
            t.deepEqual(order.paymentSummary.voucherAmount, voucher.amount);
            t.deepEqual(Math.abs(order.paymentSummary.accountCredit), credit);

            const payDollarCreditCard: Model.PayDollarCreditCard =
                checkout.creditCard;
            payDollarCreditCard.cardHolder = "testing card";
            payDollarCreditCard.cardNo = "4335900000140045";
            payDollarCreditCard.pMethod = "VISA";
            payDollarCreditCard.epMonth = 7;
            payDollarCreditCard.epYear = 2020;
            payDollarCreditCard.securityCode = "123";

            const result = await request.postFormUrlPlain(
                config.payDollarApi,
                payDollarCreditCard,
                cookie,
                config.payDollarBase
            );
            const parse = await request.parsePayDollarRes(result.body);

            t.deepEqual(parse.successcode, "0");
            t.deepEqual(parse.Ref, checkout.creditCard.orderRef);
            t.regex(parse.errMsg, /Transaction completed/);

            order = await requestOrder.getOrderInfo(checkout.orderId, cookie);

            t.deepEqual(order.status, "placed");
        }
    }
);

test.serial(
    "Order status is Placed when checkout with saved CC - voucher (percentage + max discount)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const matchedCard = await requestCreditcard.getCard(
                "PayDollar",
                t.context["cookie"]
            );

            const voucher = await access.getVoucher({
                expiry: { $gte: new Date() },
                binRange: "433590,542288,555555,400000,4111",
                discountType: "percentage",
                maximumDiscountAmount: { $gt: 0 },
                numberOfUsage: 0,
                multipleUser: true,
                oncePerAccount: false
            });

            t.truthy(voucher);

            const cookie = await request.getLogInCookie(
                config.testAccount.email_ex[7],
                config.testAccount.password_ex
            );

            const item = await requestProduct.getInStockProduct(
                config.api.todaySales,
                1
            );
            await requestCart.addToCart(item.id, cookie);

            checkoutInput.account = await requestAccount.getAccountInfo(cookie);
            checkoutInput.addresses = addresses;
            checkoutInput.voucherId = voucher._id;
            checkoutInput.methodData = matchedCard;

            const checkout = await request.checkoutPayDollar(
                checkoutInput,
                cookie
            );

            t.truthy(checkout.orderId);

            let order = await requestOrder.getOrderInfo(
                checkout.orderId,
                cookie
            );

            t.true(checkout.creditCard.orderRef.includes(order.code));
            t.deepEqual(order.status, "pending");
            t.deepEqual(order.paymentSummary.method, "CC");
            t.deepEqual(order.paymentSummary.shipping, 0);
            t.true(
                order.paymentSummary.voucherAmount <=
                    voucher.maximumDiscountAmount
            );

            const payDollarCreditCard: Model.PayDollarCreditCard =
                checkout.creditCard;
            const result = await request.postFormUrlPlain(
                config.payDollarApi,
                payDollarCreditCard,
                cookie,
                config.payDollarBase
            );
            const parse = await request.parsePayDollarRes(result.body);

            t.deepEqual(parse.successcode, "0");
            t.deepEqual(parse.Ref, checkout.creditCard.orderRef);
            t.regex(parse.errMsg, /Transaction completed/);

            order = await requestOrder.getOrderInfo(checkout.orderId, cookie);

            t.deepEqual(order.status, "placed");
        }
    }
);
