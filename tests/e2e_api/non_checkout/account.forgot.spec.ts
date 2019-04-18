import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as faker from "faker/locale/vi";

const request = new Utils.AccountUtils();

import test from "ava";

test("Get 400 error code when using empty email", async t => {
    const res = await request.post(config.api.forgot, {
        email: ""
    });

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "EMAIL_ADDRESS_REQUIRED");
});

test("Get 400 error code when missing email field", async t => {
    const res = await request.post(config.api.forgot, {});

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "EMAIL_ADDRESS_REQUIRED");
});

test("Get 404 error code when using non-existed email", async t => {
    const res = await request.post(config.api.forgot, {
        email: "QA_" + faker.internet.email()
    });

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "EMAIL_NOT_EXIST");
});

test("Get 400 error code when using wrong format email", async t => {
    const res = await request.post(config.api.forgot, {
        email: ".test%!@#$%^&*()_+<>?@mail.com"
    });

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "REGISTER_INVALID_EMAIL");
});

test("Get 404 error code when using Facebook email", async t => {
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

test("Get 200 success code when using existed email", async t => {
    const res = await request.post(config.api.forgot, {
        email: config.testAccount.email_ex[0]
    });

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(res.body.message, "RESET_LINK_HAS_BEEN_SENT");
});
