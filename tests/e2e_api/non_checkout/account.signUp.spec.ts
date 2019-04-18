import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as faker from "faker/locale/vi";
import * as Model from "../../../common/interface";

const request = new Utils.AccountUtils();

import test from "ava";

test("Get 400 error code when using empty email and password", async t => {
    const res = await request.post(config.api.signUp, {
        email: "",
        password: "",
        language: "vn",
        gender: "M"
    });

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "EMAIL_ADDRESS_REQUIRED");
});

test("Get 400 error code when using wrong format email", async t => {
    const res = await request.post(config.api.signUp, {
        email: ".test%!@#$%^&*()_+<>?@mail.com",
        password: faker.internet.password,
        language: "vn",
        gender: "M"
    });

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "REGISTER_INVALID_EMAIL");
});

test("Get 500 error code when using password with length < 7", async t => {
    const res = await request.post(config.api.signUp, {
        email: "QA_" + faker.internet.email(),
        password: "123",
        language: "vn",
        gender: "M"
    });

    t.deepEqual(res.statusCode, 500);
    t.deepEqual(
        res.body.message,
        "User validation failed: password: Password should be longer"
    );
});

test("Get 400 error code when using existed account", async t => {
    const res = await request.post(config.api.signUp, {
        email: config.testAccount.email_ex[1],
        password: config.testAccount.password_ex,
        language: "vn",
        gender: "M"
    });

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "EMAIL_ALREADY_EXISTS");
});

test("Get 400 error code when missing email field", async t => {
    const res = await request.post(config.api.signUp, {
        password: faker.internet.password()
    });

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "EMAIL_ADDRESS_REQUIRED");
});

test("Get 500 error code when missing password field", async t => {
    const res = await request.post(config.api.signUp, {
        email: "QA_" + faker.internet.email()
    });

    t.deepEqual(res.statusCode, 500);
    t.deepEqual(
        res.body.message,
        "User validation failed: password: Password should be longer"
    );
});

test("Get 200 success code when using non-existed credentials", async t => {
    const email = "QA_" + faker.internet.email();
    const res = await request.post(config.api.signUp, {
        email: email,
        password: faker.internet.password(),
        language: "vn",
        gender: "M"
    });

    const signUp: Model.SignIn = res.body;

    t.deepEqual(res.statusCode, 200);
    t.truthy(signUp.id);
    t.falsy(signUp.firstName);
    t.falsy(signUp.lastName);
    t.deepEqual(signUp.email, email.toLowerCase());
    t.deepEqual(signUp.language, "vn");
    t.deepEqual(signUp.accountCredit, 0);
    t.deepEqual(signUp.provider, "local");
    t.deepEqual(signUp.state, "confirmed");
    t.false(signUp.preview);
    t.deepEqual(signUp.gender, "M");
    t.deepEqual(signUp.cart.length, 0);
});

// test.only("generate fake users", async t => {
//     const emailList = config.testAccount.email_ex;

//     for (const email of emailList) {
//         const res = await request.post(config.api.signUp, {
//             email: email,
//             password: "123456789",
//             language: "vn",
//             gender: "M"
//         });
//     }
// });
