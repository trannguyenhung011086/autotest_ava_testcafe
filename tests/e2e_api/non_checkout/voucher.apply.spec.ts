import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";
import * as faker from "faker/locale/vi";

const checkoutInput: Model.CheckoutInput = {};

const helper = new Utils.Helper();
const access = new Utils.DbAccessUtils();
const requestProduct = new Utils.ProductUtils();
const requestCart = new Utils.CartUtils();
const requestAccount = new Utils.AccountUtils();
const requestAddress = new Utils.AddressUtils();
const requestCheckout = new Utils.CheckoutUtils();

let customer: any;
let addresses: Model.Addresses;
let account: Model.Account;
let customerData: any;

import test from "ava";

// wait for WWW-717

test.before(async t => {
    t.context["cookie"] = await helper.getLogInCookie(
        config.testAccount.email_in,
        config.testAccount.password_in
    );

    customer = await access.getCustomerInfo({
        email: config.testAccount.email_in
    });

    addresses = await requestAddress.getAddresses(t.context["cookie"]);
    account = await requestAccount.getAccountInfo(t.context["cookie"]);

    customerData = {
        method: "CC",
        shipping: 0,
        accountCredit: account.accountCredit,
        cart: account.cart,
        address: {
            shipping: addresses.shipping,
            billing: addresses.billing
        },
        voucher: "VOUCHERCODE",
        language: "vn",
        email: account.email,
        saveCard: false
    };
});

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context["cookie"]);
});

test("Get 401 error code when using voucher with invalid cookie", async t => {
    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        "leflair.connect2.sid=test"
    );

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "Access denied.");
});

test("Get 400 error code when using invalid voucher", async t => {
    customerData.voucher = "INVALID";

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_NOT_EXISTS");
});

test("Get 400 error code when using not started voucher", async t => {
    const voucher = await access.getVoucher({
        startDate: { $gt: new Date() }
    });

    t.truthy(voucher);

    customerData.voucher = voucher.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_CAMPAIGN_INVALID_OR_NOT_STARTED");
});

test("Get 400 error code when using expired voucher", async t => {
    const voucher = await access.getVoucher({
        expiry: { $lt: new Date() }
    });

    t.truthy(voucher);

    customerData.voucher = voucher.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_CAMPAIGN_INVALID_OR_ENDED");
});

test("Get 400 error code when using voucher not meet min items", async t => {
    const voucher = await access.getVoucher({
        expiry: { $gt: new Date() },
        numberOfItems: { $gte: 2 }
    });

    t.truthy(voucher);

    customerData.cart = [
        {
            id: "5c9caa433486ca0ef3da49c1",
            quantity: 1,
            salePrice: 269000
        }
    ];
    customerData.voucher = voucher.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "NOT_MEET_MINIMUM_ITEMS");
    t.deepEqual(res.body.data.voucher.numberOfItems, voucher.numberOfItems);
});

test("Get 400 error code when using voucher not apply for today", async t => {
    const today = new Date().getDay();
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        specificDays: { $size: 1 },
        "specificDays.0": { $exists: true, $ne: today }
    });

    t.truthy(voucher);

    customerData.voucher = voucher.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_NOT_APPLY_FOR_TODAY");
    t.deepEqual(res.body.data.voucher.specificDays, voucher.specificDays);
});

test("Get 400 error code when using voucher not meet min purchase", async t => {
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        binRange: { $exists: false },
        minimumPurchase: { $gt: 500000 }
    });

    t.truthy(voucher);

    customerData.cart = [
        {
            id: "5c9caa433486ca0ef3da49c1",
            quantity: 1,
            salePrice: 269000
        }
    ];
    customerData.voucher = voucher.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "TOTAL_VALUE_LESS_THAN_VOUCHER_MINIMUM");
});

test("Get 400 error code when using voucher for specific customer", async t => {
    const customer = await access.getCustomerInfo({
        email: config.testAccount.email_in
    });
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        customer: { $exists: true, $ne: customer._id }
    });

    t.truthy(voucher);

    customerData.cart = [
        {
            id: "5c9caa433486ca0ef3da49c1",
            quantity: 1,
            salePrice: 1269000
        }
    ];
    customerData.voucher = voucher.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "NOT_ALLOWED_TO_USE_VOUCHER");
});

test("Get 400 error code when using voucher exceed number of usage (skip-prod)", async t => {
    if (process.env.NODE_ENV == "prod") {
        t.log("Skip checkout with voucher on prod!");
        t.pass();
    } else {
        const voucher = await access.getNotUsedVoucher(
            {
                expiry: { $gte: new Date() },
                multipleUser: true,
                numberOfUsage: 1
            },
            customer
        );

        t.truthy(voucher);

        const item = await requestProduct.getInStockProduct(
            config.api.currentSales,
            2
        );
        await requestCart.addToCart(item.id, t.context["cookie"]);

        account = await requestAccount.getAccountInfo(t.context["cookie"]);

        checkoutInput.account = account;
        checkoutInput.addresses = addresses;
        checkoutInput.voucherId = voucher._id;

        const order = await requestCheckout.checkoutCod(
            checkoutInput,
            t.context["cookie"]
        );

        t.truthy(order);

        customerData.voucher = voucher.code;

        const res = await helper.post(
            config.api.voucherApply,
            customerData,
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "EXCEED_TIME_OF_USAGE");
    }
});

test("Get 400 error code when using voucher already used", async t => {
    const voucher = await access.getUsedVoucher(
        {
            expiry: { $gte: new Date() },
            binRange: { $exists: false },
            oncePerAccount: true
        },
        customer
    );

    t.truthy(voucher);

    customerData.voucher = voucher.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "YOU_ALREADY_USED_THIS_VOUCHER");
});

test("Get 400 error code when using voucher already used by phone number", async t => {
    const voucherList = await access.getVoucherList({
        expiry: { $gte: new Date() },
        binRange: { $exists: false },
        oncePerAccount: true
    });

    let matched: Model.VoucherModel;

    for (const voucher of voucherList) {
        const used = await access.countUsedVoucher(voucher._id);
        if (used > 0) {
            matched = voucher;
            break;
        }
    }

    t.truthy(matched);

    const order = await access.getOrderUsedVoucher(matched._id);

    t.truthy(order);

    customerData.address = {
        shipping: order.address.shipping,
        billing: order.address.billing
    };
    customerData.voucher = matched.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "YOU_ALREADY_USED_THIS_VOUCHER");
});

test("Get 400 error code when using voucher used by another customer", async t => {
    const voucherList = await access.getVoucherList({
        expiry: { $gt: new Date() },
        startDate: { $lt: new Date() },
        multipleUser: false,
        customer: { $exists: false },
        numberOfItems: 0,
        binRange: { $exists: false },
        numberOfUsage: { $gt: 1 }
    });

    let matched: Model.VoucherModel;

    for (const voucher of voucherList) {
        const used = await access.countUsedVoucher(voucher._id);
        if (used > 0) {
            matched = voucher;
            break;
        }
    }

    t.truthy(matched);

    customerData.voucher = matched.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_ALREADY_USED");
});

test("Get 400 error code when using voucher for new customer", async t => {
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        forNewCustomer: true
    });

    t.truthy(voucher);

    customerData.voucher = voucher.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_ONLY_FOR_NEW_CUSTOMER");
});

test("Get 400 error code when using voucher for new customer by phone number", async t => {
    const voucherList = await access.getVoucherList({
        expiry: { $gte: new Date() },
        forNewCustomer: true
    });

    let matched: Model.VoucherModel;

    for (const voucher of voucherList) {
        const used = await access.countUsedVoucher(voucher._id);
        if (used > 0) {
            matched = voucher;
            break;
        }
    }

    t.truthy(matched);

    const order = await access.getOrderUsedVoucher(matched._id);

    t.truthy(order);

    const email = faker.internet.email();
    const password = faker.internet.password();
    const cookie = await helper.getSignUpCookie(email, password);

    customerData.address = {
        shipping: order.address.shipping,
        billing: order.address.billing
    };
    customerData.voucher = matched.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        cookie
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_ONLY_FOR_NEW_CUSTOMER");
});

test("Get 400 error code when using voucher for expired campaign", async t => {
    const voucher = await access.getVoucher({
        webCampaign: { $exists: true },
        expiry: { $lt: new Date() }
    });

    t.truthy(voucher);

    customerData.voucher = voucher.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_CAMPAIGN_INVALID_OR_ENDED");
});

test("Get 400 error code when using more than 1 voucher per campaign", async t => {
    if (process.env.NODE_ENV == "prod") {
        t.log("Skip checkout with voucher on prod!");
        t.pass();
    } else {
        const voucher = await access.getNotUsedVoucher(
            {
                oncePerAccountForCampaign: true,
                campaign: /Grab Rewards Premium/
            },
            customer
        );

        t.truthy(voucher);

        const item = await requestProduct.getInStockProduct(
            config.api.currentSales,
            2
        );
        await requestCart.addToCart(item.id, t.context["cookie"]);

        account = await requestAccount.getAccountInfo(t.context["cookie"]);

        checkoutInput.account = account;
        checkoutInput.addresses = addresses;
        checkoutInput.voucherId = voucher._id;

        const order = await requestCheckout.checkoutCod(
            checkoutInput,
            t.context["cookie"]
        );

        t.truthy(order);

        const voucherNew = await access.getNotUsedVoucher(
            {
                oncePerAccountForCampaign: true,
                campaign: /Grab Rewards Premium/,
                code: { $ne: voucher.code }
            },
            customer
        );

        t.truthy(voucherNew);

        customerData.cart = [
            {
                id: "5c9caa433486ca0ef3da49c1",
                quantity: 1,
                salePrice: 1269000
            }
        ];
        customerData.voucher = voucherNew.code;

        const res = await helper.post(
            config.api.voucherApply,
            customerData,
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "VOUCHER_PER_CAMPAIGN");
    }
});

test("Get 400 error code when using voucher for CC", async t => {
    const voucher = await access.getVoucher({
        expiry: { $gte: new Date() },
        binRange: { $exists: true },
        minimumPurchase: 0
    });

    t.truthy(voucher);

    customerData.method = "COD";
    customerData.voucher = voucher.code;

    const res = await helper.post(
        config.api.voucherApply,
        customerData,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "REQUIRES_CC_PAYMENT");
});
