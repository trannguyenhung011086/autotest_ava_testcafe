import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";
import * as faker from "faker/locale/vi";

const request = new Utils.AccountUtils();

import test from "ava";

test("POST / empty email", async t => {
    const res = await request.post(config.api.forgot, {
        email: ""
    });

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "EMAIL_ADDRESS_REQUIRED");
    t.snapshot(res.body);
});

test("POST / missing email field", async t => {
    const res = await request.post(config.api.forgot, {});

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "EMAIL_ADDRESS_REQUIRED");
    t.snapshot(res.body);
});

test("POST / non-existing email", async t => {
    const res = await request.post(config.api.forgot, {
        email: "QA_" + faker.internet.email()
    });

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "EMAIL_NOT_EXIST");
    t.snapshot(res.body);
});

test("POST / wrong format email", async t => {
    const res = await request.post(config.api.forgot, {
        email: ".test%!@#$%^&*()_+<>?@mail.com"
    });

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "REGISTER_INVALID_EMAIL");
    t.snapshot(res.body);
});

test("POST / Facebook email", async t => {
    const res = await request.post(config.api.forgot, {
        email: "trannguyenhung011086@gmail.com"
    });

    if (process.env.NODE_ENV == "prod") {
        t.deepEqual(res.statusCode, 404);
        t.deepEqual(res.body.message, "COULD_NOT_RESET_OF_FACEBOOK_ACCOUNT");
    } else {
        t.deepEqual(res.statusCode, 404);
        t.deepEqual(res.body.message, "EMAIL_NOT_EXIST");
    }
});

test("POST / existing email", async t => {
    const res = await request.post(config.api.forgot, {
        email: config.testAccount.email_ex[0]
    });

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(res.body.message, "RESET_LINK_HAS_BEEN_SENT");
    t.snapshot(res.body);
});
