import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

const helper = new Utils.Helper();
const access = new Utils.DbAccessUtils();

import test from "ava";

test.beforeEach(async t => {
    t.context["cookie"] = await helper.pickRandomUser(
        config.testAccount.email_ex
    );
});

test("Get 400 error code when using invalid voucher", async t => {
    const res = await helper.get(
        config.api.voucher + "INVALID-ID",
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_NOT_EXISTS");
});

test("Get 400 error code when using expired voucher", async t => {
    const voucherInfo = await access.getVoucher({
        expiry: { $lt: new Date() }
    });

    t.truthy(voucherInfo);

    const res = await helper.get(
        config.api.voucher + voucherInfo.code,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_CAMPAIGN_INVALID_OR_ENDED");
});

test("Get 400 error code when using not started voucher", async t => {
    const voucherInfo = await access.getVoucher({
        startDate: { $gt: new Date() }
    });

    t.truthy(voucherInfo);

    const res = await helper.get(
        config.api.voucher + voucherInfo.code,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_CAMPAIGN_INVALID_OR_NOT_STARTED");
});

test("Get 400 error code when using redeemed voucher", async t => {
    const voucherInfo = await access.getVoucher({
        startDate: { $gt: new Date("2018-11-01T14:56:59.301Z") },
        expiry: { $gte: new Date() },
        used: true
    });

    t.truthy(voucherInfo);

    const res = await helper.get(
        config.api.voucher + voucherInfo.code,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_HAS_BEEN_REDEEMED");
});

test("Get 400 error code when using already used voucher", async t => {
    const cookie = await helper.getLogInCookie(
        config.testAccount.email_in,
        config.testAccount.password_in
    );

    const customer = await access.getCustomerInfo({
        email: config.testAccount.email_in
    });

    const voucher = await access.getUsedVoucher(
        {
            expiry: { $gte: new Date() },
            binRange: { $exists: false },
            used: false,
            oncePerAccount: true
        },
        customer
    );

    t.truthy(voucher);

    const res = await helper.get(config.api.voucher + voucher.code, cookie);

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "YOU_ALREADY_USED_THIS_VOUCHER");
}); // wait for WWW-490

test("Get 400 error code when using not allowed to use voucher ", async t => {
    const voucherInfo = await access.getVoucher({
        expiry: { $gte: new Date() },
        customer: { $exists: true }
    });

    t.truthy(voucherInfo);

    const res = await helper.get(
        config.api.voucher + voucherInfo.code,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "NOT_ALLOWED_TO_USE_VOUCHER");
});

test("Get 200 success code when using valid voucher", async t => {
    const voucherInfo = await access.getVoucher({
        expiry: { $gte: new Date() },
        oncePerAccount: false,
        used: false
    });

    t.truthy(voucherInfo);

    const res = await helper.get(
        config.api.voucher + voucherInfo.code,
        t.context["cookie"]
    );

    const voucher: Model.Voucher = res.body;

    t.deepEqual(res.statusCode, 200);
    t.true(voucher.amount > 0);
    t.deepEqual(voucher.code, voucherInfo.code);
    t.regex(voucher.discountType, /amount|percentage/);
    t.deepEqual(typeof voucher.freeShipping, "boolean");
    t.truthy(voucher.id);
    t.true(voucher.hasOwnProperty("maximumDiscountAmount"));
    t.true(voucher.hasOwnProperty("minimumPurchase"));
    t.true(voucher.hasOwnProperty("numberOfItems"));
    t.true(voucher.hasOwnProperty("specificDays"));
});

test("Get 401 error code when using voucher with invalid cookie", async t => {
    const res = await helper.get(
        config.api.voucher + "CARD-ID",
        "leflair.connect2.sid=test"
    );

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "Access denied.");
});
