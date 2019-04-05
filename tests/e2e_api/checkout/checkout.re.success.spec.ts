import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let customer: Model.Customer;
let addresses: Model.Addresses;
let failedAttemptOrder: Model.FailedAttempt;
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
        config.testAccount.email_ex[7],
        config.testAccount.password_ex
    );

    addresses = await requestAddress.getAddresses(t.context["cookie"]);
    customer = await access.getCustomerInfo({
        email: config.testAccount.email_ex[7].toLowerCase()
    });

    const item = await requestProduct.getProductWithCountry("VN", 0, 2000000);

    failedAttemptOrder = await request.createFailedAttemptOrder(
        [item],
        t.context["cookie"]
    );
    t.truthy(failedAttemptOrder.orderId);

    checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
    );
    checkoutInput.addresses = addresses;
    checkoutInput.cart = [
        {
            id: failedAttemptOrder.products[0].id,
            quantity: failedAttemptOrder.products[0].quantity,
            salePrice: failedAttemptOrder.products[0].salePrice
        }
    ];
    checkoutInput.orderCode = failedAttemptOrder.code;
});

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context["cookie"]);
});

test.serial("Order status is Placed when recheckout with COD", async t => {
    const reCheckout = await request.checkoutCod(
        checkoutInput,
        t.context["cookie"]
    );
    t.truthy(reCheckout.orderId);

    const order = await requestOrder.getOrderInfo(
        reCheckout.orderId,
        t.context["cookie"]
    );

    t.true(order.code.includes(reCheckout.code));
    t.deepEqual(order.status, "placed");
    t.deepEqual(order.paymentSummary.method, "COD");
    t.deepEqual(order.paymentSummary.shipping, 25000);
});

test.serial(
    "Order status is Placed when recheckout with new CC (not save card) - VISA (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            checkoutInput.saveNewCard = false;

            const reCheckout = await request.checkoutPayDollar(
                checkoutInput,
                t.context["cookie"]
            );
            t.truthy(reCheckout.orderId);

            let order = await requestOrder.getOrderInfo(
                reCheckout.orderId,
                t.context["cookie"]
            );

            t.true(reCheckout.creditCard.orderRef.includes(order.code));
            t.deepEqual(order.status, "pending");
            t.deepEqual(order.paymentSummary.method, "CC");
            t.deepEqual(order.paymentSummary.shipping, 0);

            const payDollarCreditCard: Model.PayDollarCreditCard =
                reCheckout.creditCard;
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
            t.deepEqual(parse.Ref, reCheckout.creditCard.orderRef);
            t.regex(parse.errMsg, /Transaction completed/);

            order = await requestOrder.getOrderInfo(
                reCheckout.orderId,
                t.context["cookie"]
            );
            t.deepEqual(order.status, "placed");
        }
    }
);

test.serial(
    "Order status is Placed when recheckout with new CC (save card) - MASTER (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            checkoutInput.saveNewCard = true;

            const reCheckout = await request.checkoutPayDollar(
                checkoutInput,
                t.context["cookie"]
            );
            t.truthy(reCheckout.orderId);

            let order = await requestOrder.getOrderInfo(
                reCheckout.orderId,
                t.context["cookie"]
            );

            t.true(reCheckout.creditCard.orderRef.includes(order.code));
            t.deepEqual(order.status, "pending");
            t.deepEqual(order.paymentSummary.method, "CC");
            t.deepEqual(order.paymentSummary.shipping, 0);

            const payDollarCreditCard: Model.PayDollarCreditCard =
                reCheckout.creditCard;
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
            t.deepEqual(parse.Ref, reCheckout.creditCard.orderRef);
            t.regex(parse.errMsg, /Transaction completed/);

            order = await requestOrder.getOrderInfo(
                reCheckout.orderId,
                t.context["cookie"]
            );
            t.deepEqual(order.status, "placed");
        }
    }
);

test.serial(
    "Order status is Placed when recheckout with saved CC (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const matchedCard = await requestCreditcard.getCard(
                "PayDollar",
                t.context["cookie"]
            );
            checkoutInput.methodData = matchedCard;

            const reCheckout = await request.checkoutPayDollar(
                checkoutInput,
                t.context["cookie"]
            );
            t.truthy(reCheckout.orderId);

            let order = await requestOrder.getOrderInfo(
                reCheckout.orderId,
                t.context["cookie"]
            );

            t.true(reCheckout.creditCard.orderRef.includes(order.code));
            t.deepEqual(order.status, "pending");
            t.deepEqual(order.paymentSummary.method, "CC");
            t.deepEqual(order.paymentSummary.shipping, 0);

            const payDollarCreditCard: Model.PayDollarCreditCard =
                reCheckout.creditCard;
            const result = await request.postFormUrlPlain(
                config.payDollarApi,
                payDollarCreditCard,
                t.context["cookie"],
                config.payDollarBase
            );
            const parse = await request.parsePayDollarRes(result.body);

            t.deepEqual(parse.successcode, "0");
            t.deepEqual(parse.Ref, reCheckout.creditCard.orderRef);
            t.regex(parse.errMsg, /Transaction completed/);

            order = await requestOrder.getOrderInfo(
                reCheckout.orderId,
                t.context["cookie"]
            );
            t.deepEqual(order.status, "placed");
        }
    }
);

test.serial(
    "Order status is Placed when recheckout with COD - voucher (amount) + credit (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout with voucher on prod!");
            t.pass();
        } else {
            const voucher = await access.getVoucher({
                expiry: { $gte: new Date() },
                numberOfItems: 0,
                minimumPurchase: 0,
                binRange: { $exists: false },
                discountType: "amount",
                multipleUser: true,
                oncePerAccount: false
            });

            t.truthy(voucher);

            const account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );

            const credit = request.calculateCredit(
                account.accountCredit,
                failedAttemptOrder.products[0].salePrice,
                voucher.amount
            );

            checkoutInput.voucherId = voucher._id;
            checkoutInput.credit = credit;

            const reCheckout = await request.checkoutCod(
                checkoutInput,
                t.context["cookie"]
            );
            t.truthy(reCheckout.orderId);

            let order = await requestOrder.getOrderInfo(
                reCheckout.orderId,
                t.context["cookie"]
            );

            t.true(order.code.includes(reCheckout.code));
            t.deepEqual(order.status, "placed");
            t.deepEqual(order.paymentSummary.method, "COD");
            t.deepEqual(order.paymentSummary.shipping, 25000);
            t.deepEqual(order.paymentSummary.voucherAmount, voucher.amount);
            t.deepEqual(Math.abs(order.paymentSummary.accountCredit), credit);
        }
    }
);

test.serial(
    "Order status is Placed when recheckout with saved CC - voucher (percentage + max discount) (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout with voucher on prod!");
            t.pass();
        } else {
            const voucher = await access.getVoucher({
                expiry: { $gte: new Date() },
                binRange: "433590,542288,555555,400000,4111",
                discountType: "percentage",
                multipleUser: true,
                oncePerAccount: false
            });

            t.truthy(voucher);

            const matchedCard = await requestCreditcard.getCard(
                "PayDollar",
                t.context["cookie"]
            );

            checkoutInput.voucherId = voucher._id;
            checkoutInput.methodData = matchedCard;

            const reCheckout = await request.checkoutPayDollar(
                checkoutInput,
                t.context["cookie"]
            );
            t.truthy(reCheckout.orderId);

            let order = await requestOrder.getOrderInfo(
                reCheckout.orderId,
                t.context["cookie"]
            );

            t.deepEqual(order.status, "pending");
            t.deepEqual(order.paymentSummary.method, "CC");
            t.deepEqual(order.paymentSummary.shipping, 0);
            t.true(
                order.paymentSummary.voucherAmount <=
                    voucher.maximumDiscountAmount
            );

            const payDollarCreditCard: Model.PayDollarCreditCard =
                reCheckout.creditCard;
            const result = await request.postFormUrlPlain(
                config.payDollarApi,
                payDollarCreditCard,
                t.context["cookie"],
                config.payDollarBase
            );
            const parse = await request.parsePayDollarRes(result.body);

            t.deepEqual(parse.successcode, "0");
            t.deepEqual(parse.Ref, reCheckout.creditCard.orderRef);
            t.regex(parse.errMsg, /Transaction completed/);

            order = await requestOrder.getOrderInfo(
                reCheckout.orderId,
                t.context["cookie"]
            );
            t.deepEqual(order.status, "placed");
        }
    }
);

// validate voucher amount

test.serial(
    "Validate voucher amount applied for recheckout order (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout with voucher on prod!");
            t.pass();
        } else {
            const voucher = await access.getVoucher({
                expiry: { $gte: new Date() },
                used: false,
                discountType: "percentage",
                maximumDiscountAmount: { $gt: 0, $lte: 150000 },
                specificDays: [],
                customer: { $exists: false },
                numberOfItems: 0
            });

            t.truthy(voucher);

            const item = await requestProduct.getProductWithCountry(
                "VN",
                2000000,
                10000000
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);

            const info: Model.CheckoutInput = {};
            info.account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );
            info.addresses = await requestAddress.getAddresses(
                t.context["cookie"]
            );
            info.voucherId = voucher._id;

            const checkout = await request.checkoutPayDollar(
                info,
                t.context["cookie"]
            );

            t.truthy(checkout.orderId);

            const payDollarCreditCard: Model.PayDollarCreditCard =
                checkout.creditCard;
            payDollarCreditCard.cardHolder = "testing";
            payDollarCreditCard.cardNo = "4335900000140045";
            payDollarCreditCard.pMethod = "VISA";
            payDollarCreditCard.epMonth = 7;
            payDollarCreditCard.epYear = 2020;
            payDollarCreditCard.securityCode = "333";

            const res = await request.postFormUrlPlain(
                config.payDollarApi,
                payDollarCreditCard,
                t.context["cookie"],
                config.payDollarBase
            );

            const parse = await request.parsePayDollarRes(res.body);

            const failedAttempt = await request.failedAttempt(
                parse.Ref,
                t.context["cookie"]
            );

            const order = await requestOrder.getOrderInfo(
                failedAttempt.orderId,
                t.context["cookie"]
            );

            t.true(
                order.paymentSummary.voucherAmount <=
                    voucher.maximumDiscountAmount
            );
        }
    }
);
