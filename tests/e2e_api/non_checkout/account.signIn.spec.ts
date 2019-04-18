import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as faker from "faker/locale/vi";
import * as Model from "../../../common/interface";

const request = new Utils.AccountUtils();

import test from "ava";

test("Get 401 error code when using wrong email", async t => {
    const res = await request.post(config.api.signIn, {
        email: "QA_" + faker.internet.email(),
        password: faker.internet.password()
    });

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "EMAIL_PASSWORD_INCORRECT");
});

test("Get 401 error code when using wrong password", async t => {
    const res = await request.post(config.api.signIn, {
        email: config.testAccount.email_ex[0],
        password: faker.internet.password()
    });

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "EMAIL_PASSWORD_INCORRECT");
});

test("Get 401 error code when using Facebook email", async t => {
    const res = await request.post(config.api.signIn, {
        email: config.testAccount.facebook,
        password: config.testAccount.passwordFacebook
    });

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "EMAIL_PASSWORD_INCORRECT");
});

test("Get 401 error code when missing email field", async t => {
    const res = await request.post(config.api.signIn, {
        password: faker.internet.password()
    });

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "EMAIL_PASSWORD_INCORRECT");
});

test("Get 401 error code when missing password field", async t => {
    const res = await request.post(config.api.signIn, {
        email: "QA_" + faker.internet.email()
    });

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "EMAIL_PASSWORD_INCORRECT");
});

test("Get 401 error code when using empty email and password", async t => {
    const res = await request.post(config.api.signIn, {
        email: "",
        password: ""
    });

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "EMAIL_PASSWORD_INCORRECT");
});

test("Get 200 success code when using correct email and password - external email", async t => {
    const res = await request.post(config.api.signIn, {
        email: config.testAccount.email_ex[0].toUpperCase(),
        password: config.testAccount.password_ex
    });

    const signIn: Model.SignIn = res.body;

    t.deepEqual(res.statusCode, 200);
    t.truthy(signIn.id.length);
    t.deepEqual(typeof signIn.firstName, "string");
    t.deepEqual(typeof signIn.lastName, "string");
    t.deepEqual(signIn.email, config.testAccount.email_ex[0].toLowerCase());
    t.regex(signIn.language, /en|vn/);
    t.deepEqual(typeof signIn.accountCredit, "number");
    t.deepEqual(signIn.provider, "local");
    t.deepEqual(signIn.state, "confirmed");
    t.false(signIn.preview);
    t.deepEqual(typeof signIn.gender, "string");
    t.true(Array.isArray(signIn.cart));
});

test("Get 200 success code when using correct email and password - internal email", async t => {
    const res = await request.post(config.api.signIn, {
        email: config.testAccount.email_in,
        password: config.testAccount.password_in
    });

    const signIn: Model.SignIn = res.body;

    t.deepEqual(res.statusCode, 200);
    t.true(signIn.preview);
});

test("Get 200 success code when sign out", async t => {
    const cookie = await request.getLogInCookie(
        config.testAccount.email_ex[1],
        config.testAccount.password_ex
    );

    const res = await request.get(config.api.signOut, cookie);

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(res.body.message, "SIGNED_OUT_SUCCESSFUL");
});
