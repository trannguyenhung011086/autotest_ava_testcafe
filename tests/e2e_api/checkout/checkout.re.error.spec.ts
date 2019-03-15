import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let customer: Model.Customer;
let addresses: Model.Addresses;
let failedAttemptOrder: Model.FailedAttempt;

const request = new Utils.CheckoutUtils();
const requestAddress = new Utils.AddressUtils();
const requestAccount = new Utils.AccountUtils();
const requestCart = new Utils.CartUtils();
const requestProduct = new Utils.ProductUtils();
const requestOrder = new Utils.OrderUtils();
const access = new Utils.DbAccessUtils();
const accessRedis = new Utils.RedisAccessUtils();

import test from "ava";

test.before(async t => {
    t.context["cookie"] = await request.getLogInCookie(
        config.testAccount.email_ex[2],
        config.testAccount.password_ex
    );

    addresses = await requestAddress.getAddresses(t.context["cookie"]);
    customer = await access.getCustomerInfo({
        email: config.testAccount.email_ex[2].toLowerCase()
    });

    const item = await requestProduct.getInStockProduct(
        config.api.currentSales,
        2
    );
    failedAttemptOrder = await request.createFailedAttemptOrder(
        [item, item],
        t.context["cookie"]
    );

    t.truthy(failedAttemptOrder.orderId);
});

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context["cookie"]);
});

// validate required data

test.serial("POST / cannot recheckout with invalid cookie", async t => {
    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {
            address: {
                shipping: addresses.shipping[0],
                billing: addresses.billing[0]
            },
            cart: [
                {
                    id: failedAttemptOrder.products[0].id,
                    quantity: failedAttemptOrder.products[0].quantity,
                    salePrice: failedAttemptOrder.products[0].salePrice
                }
            ],
            method: "COD",
            shipping: 25000,
            accountCredit: 0
        },
        "leflair.connect2.sid=test"
    );

    t.deepEqual(res.statusCode, 500);
    t.snapshot(res.body);
});

test.serial("POST / cannot recheckout with empty data", async t => {
    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {},
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 500);
    t.snapshot(res.body);
});

test.serial("POST / cannot recheckout without address", async t => {
    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {
            address: {
                shipping: {},
                billing: {}
            }
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.true(res.body.message.includes("SHIPPING_ADDRESS_REQUIRED"));
    t.true(res.body.message.includes("BILLING_ADDRESS_REQUIRED"));
    t.snapshot(res.body);
});

test.serial("POST / cannot recheckout with empty cart", async t => {
    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {
            address: {
                shipping: addresses.shipping[0],
                billing: addresses.billing[0]
            },
            cart: []
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.true(res.body.message.includes("THERE_ARE_NO_ITEMS_IN_YOUR_ORDER"));
    t.snapshot(res.body);
});

test.serial(
    "POST / cannot recheckout with invalid phone and tax code",
    async t => {
        const res = await request.post(
            config.api.checkout + "/order/" + failedAttemptOrder.code,
            {
                address: {
                    shipping: {
                        phone: "35955"
                    },
                    billing: {
                        taxCode: "97436",
                        phone: "4353"
                    }
                },
                cart: [
                    {
                        id: failedAttemptOrder.products[0].id,
                        quantity: failedAttemptOrder.products[0].quantity,
                        salePrice: failedAttemptOrder.products[0].salePrice
                    }
                ]
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.true(res.body.message.includes("SHIPPING_PHONE_NUMBER_IS_NOT_VALID"));
        t.true(res.body.message.includes("BILLING_PHONE_NUMBER_IS_NOT_VALID"));
        t.true(res.body.message.includes("INVALID_BILLING_TAX_CODE"));
        t.snapshot(res.body);
    }
);

test.serial("POST / cannot recheckout without payment method", async t => {
    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {
            address: {
                shipping: addresses.shipping[0],
                billing: addresses.billing[0]
            },
            cart: [
                {
                    id: failedAttemptOrder.products[0].id,
                    quantity: failedAttemptOrder.products[0].quantity,
                    salePrice: failedAttemptOrder.products[0].salePrice
                }
            ]
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.true(res.body.message.includes("PLEASE_SELECT_A_PAYMENT_METHOD"));
    t.snapshot(res.body);
});

// validate cart

test.serial("POST / cannot recheckout with mismatched cart", async t => {
    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {
            address: {
                shipping: addresses.shipping[0],
                billing: addresses.billing[0]
            },
            cart: [
                {
                    id: failedAttemptOrder.products[0].id,
                    quantity: failedAttemptOrder.products[0].quantity,
                    salePrice: failedAttemptOrder.products[0].salePrice
                },
                {
                    id: failedAttemptOrder.products[0].id,
                    quantity: failedAttemptOrder.products[0].quantity,
                    salePrice: failedAttemptOrder.products[0].salePrice
                }
            ],
            method: "FREE"
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "CART_MISMATCH");
});

test.serial("POST / cannot recheckout with mismatched quantity", async t => {
    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {
            address: {
                shipping: addresses.shipping[0],
                billing: addresses.billing[0]
            },
            cart: [
                {
                    id: failedAttemptOrder.products[0].id,
                    quantity: failedAttemptOrder.products[0].quantity + 1,
                    salePrice: failedAttemptOrder.products[0].salePrice
                }
            ],
            method: "FREE"
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(
        res.body.message[0].message,
        "QUANTITY_SUBMITTED_NOT_MATCH_IN_THE_CART"
    );
});

test.serial("POST / cannot recheckout with mismatched price", async t => {
    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {
            address: {
                shipping: addresses.shipping[0],
                billing: addresses.billing[0]
            },
            cart: [
                {
                    id: failedAttemptOrder.products[0].id,
                    quantity: failedAttemptOrder.products[0].quantity,
                    salePrice: failedAttemptOrder.products[0].salePrice - 1
                }
            ],
            method: "FREE"
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message[0].message, "PRICE_MISMATCH");
});

test.serial("POST / cannot recheckout with invalid product", async t => {
    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {
            address: {
                shipping: addresses.shipping[0],
                billing: addresses.billing[0]
            },
            cart: [
                {
                    id: "INVALID-ID",
                    quantity: failedAttemptOrder.products[0].quantity,
                    salePrice: failedAttemptOrder.products[0].salePrice
                }
            ],
            method: "FREE"
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message[0].message, "CART_MISMATCH_CANT_FIND_PRODUCT");
});

// validate availability

test.serial(
    "POST / cannot recheckout with sold out product (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            let originalQuantity: number;
            let redisItem: string;

            try {
                redisItem = await accessRedis.getKey(
                    "nsId:" + failedAttemptOrder.products[0].nsId
                );
                originalQuantity = redisItem["quantity"];

                // set quantity on Redis
                redisItem["quantity"] = 0;
                await accessRedis.setValue(
                    "nsId:" + failedAttemptOrder.products[0].nsId,
                    JSON.stringify(redisItem)
                );

                const res = await request.post(
                    config.api.checkout + "/order/" + failedAttemptOrder.code,
                    {
                        address: {
                            shipping: addresses.shipping[0],
                            billing: addresses.billing[0]
                        },
                        cart: [
                            {
                                id: failedAttemptOrder.products[0].id,
                                quantity:
                                    failedAttemptOrder.products[0].quantity,
                                salePrice:
                                    failedAttemptOrder.products[0].salePrice
                            }
                        ],
                        method: "FREE"
                    },
                    t.context["cookie"]
                );

                t.deepEqual(res.statusCode, 400);
                t.deepEqual(
                    res.body.message[0].message,
                    "TITLE_IS_OUT_OF_STOCK"
                );
                t.deepEqual(
                    res.body.message[0].values.title,
                    failedAttemptOrder.products[0].title
                );
                t.snapshot(res.body);
            } catch (err) {
                throw err;
            } finally {
                // reset quantity on Redis
                redisItem["quantity"] = originalQuantity;
                await accessRedis.setValue(
                    "nsId:" + failedAttemptOrder.products[0].nsId,
                    JSON.stringify(redisItem)
                );
            }
        }
    }
);

test.serial(
    "POST / cannot recheckout with limited stock product (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            let originalQuantity: number;
            let redisItem: string;

            try {
                redisItem = await accessRedis.getKey(
                    "nsId:" + failedAttemptOrder.products[0].nsId
                );
                originalQuantity = redisItem["quantity"];

                // set quantity on Redis
                redisItem["quantity"] = 1;
                await accessRedis.setValue(
                    "nsId:" + failedAttemptOrder.products[0].nsId,
                    JSON.stringify(redisItem)
                );

                const res = await request.post(
                    config.api.checkout + "/order/" + failedAttemptOrder.code,
                    {
                        address: {
                            shipping: addresses.shipping[0],
                            billing: addresses.billing[0]
                        },
                        cart: [
                            {
                                id: failedAttemptOrder.products[0].id,
                                quantity:
                                    failedAttemptOrder.products[0].quantity,
                                salePrice:
                                    failedAttemptOrder.products[0].salePrice
                            }
                        ],
                        method: "FREE"
                    },
                    t.context["cookie"]
                );

                t.deepEqual(res.statusCode, 400);
                t.deepEqual(
                    res.body.message[0].message,
                    "ONLY_LIMITED_UNITS_IN_STOCK"
                );
                t.deepEqual(
                    res.body.message[0].values.title,
                    failedAttemptOrder.products[0].title
                );
            } catch (err) {
                throw err;
            } finally {
                // reset quantity on Redis
                redisItem["quantity"] = originalQuantity;
                await accessRedis.setValue(
                    "nsId:" + failedAttemptOrder.products[0].nsId,
                    JSON.stringify(redisItem)
                );
            }
        }
    }
);

test.serial(
    "POST / cannot recheckout with sale ended product (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            let originalEnd: string;
            let redisItem: string;

            try {
                redisItem = await accessRedis.getKey(
                    "productId:" +
                        failedAttemptOrder.products[0].productContentId
                );
                originalEnd = redisItem["event"]["endDate"];

                // set date on Redis
                redisItem["event"]["endDate"] = "2019-02-18T01:00:00.000Z";
                await accessRedis.setValue(
                    "productId:" +
                        failedAttemptOrder.products[0].productContentId,
                    JSON.stringify(redisItem)
                );

                const res = await request.post(
                    config.api.checkout + "/order/" + failedAttemptOrder.code,
                    {
                        address: {
                            shipping: addresses.shipping[0],
                            billing: addresses.billing[0]
                        },
                        cart: [
                            {
                                id: failedAttemptOrder.products[0].id,
                                quantity:
                                    failedAttemptOrder.products[0].quantity,
                                salePrice:
                                    failedAttemptOrder.products[0].salePrice
                            }
                        ],
                        method: "FREE"
                    },
                    t.context["cookie"]
                );

                t.deepEqual(res.statusCode, 400);
                t.deepEqual(
                    res.body.message[0].message,
                    "THE_SALE_FOR_TITLE_HAS_ENDED"
                );
                t.deepEqual(
                    res.body.message[0].values.title,
                    failedAttemptOrder.products[0].title
                );
                t.snapshot(res.body);
            } catch (err) {
                throw err;
            } finally {
                // reset date on Redis
                redisItem["event"]["endDate"] = originalEnd;
                await accessRedis.setValue(
                    "productId:" +
                        failedAttemptOrder.products[0].productContentId,
                    JSON.stringify(redisItem)
                );
            }
        }
    }
);

// validate address

test.skip("POST / cannot recheckout with new address", async t => {
    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {
            address: {
                shipping: addresses.shipping[1],
                billing: addresses.billing[1]
            },
            cart: [
                {
                    id: failedAttemptOrder.products[0].id,
                    quantity: failedAttemptOrder.products[0].quantity,
                    salePrice: failedAttemptOrder.products[0].salePrice
                }
            ],
            method: "FREE"
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message[0].message, "CART_MISMATCH_CANT_FIND_PRODUCT");
    t.snapshot(res.body);
}); // wait for WWW-401

// validate voucher

test.serial(
    "POST / cannot recheckout with voucher not meeting min items",
    async t => {
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $gt: 2 }
        });

        t.truthy(voucher);

        const res = await request.post(
            config.api.checkout + "/order/" + failedAttemptOrder.code,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: failedAttemptOrder.products[0].id,
                        quantity: failedAttemptOrder.products[0].quantity,
                        salePrice: failedAttemptOrder.products[0].salePrice
                    }
                ],
                method: "COD",
                shipping: 25000,
                voucher: voucher._id
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "NOT_MEET_MINIMUM_ITEMS");
        t.deepEqual(res.body.data.voucher.numberOfItems, voucher.numberOfItems);
        t.snapshot(res.body);
    }
);

test.serial(
    "POST / cannot recheckout with voucher not applied for today",
    async t => {
        const today = new Date().getDay();
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            specificDays: { $size: 1 },
            "specificDays.0": { $exists: true, $ne: today }
        });

        t.truthy(voucher);

        const res = await request.post(
            config.api.checkout + "/order/" + failedAttemptOrder.code,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: failedAttemptOrder.products[0].id,
                        quantity: failedAttemptOrder.products[0].quantity,
                        salePrice: failedAttemptOrder.products[0].salePrice
                    }
                ],
                method: "COD",
                shipping: 25000,
                voucher: voucher._id
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "VOUCHER_NOT_APPLY_FOR_TODAY");
        t.deepEqual(res.body.data.voucher.specificDays, voucher.specificDays);
        t.snapshot(res.body);
    }
);

test.serial(
    "POST / cannot recheckout with voucher not meeting min purchase",
    async t => {
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: { $exists: false },
            minimumPurchase: { $gte: failedAttemptOrder.products[0].salePrice },
            numberOfUsage: null
        });

        t.truthy(voucher);

        const res = await request.post(
            config.api.checkout + "/order/" + failedAttemptOrder.code,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: failedAttemptOrder.products[0].id,
                        quantity: failedAttemptOrder.products[0].quantity,
                        salePrice: failedAttemptOrder.products[0].salePrice
                    }
                ],
                method: "COD",
                shipping: 25000,
                voucher: voucher._id
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "TOTAL_VALUE_LESS_THAN_VOUCHER_MINIMUM");
        t.snapshot(res.body);
    }
);

test.serial(
    "POST / cannot recheckout with voucher exceeding number of usage",
    async t => {
        const vouchers = await access.getVoucherList({
            expiry: { $gte: new Date() },
            multipleUser: true,
            numberOfUsage: { $gte: 1 },
            used: false
        });
        let matchedVoucher: Model.VoucherModel;

        for (const voucher of vouchers) {
            const used = await access.countUsedVoucher(voucher._id);
            if (voucher.numberOfUsage <= used) {
                matchedVoucher = voucher;
                break;
            }
        }

        t.truthy(matchedVoucher);

        const res = await request.post(
            config.api.checkout + "/order/" + failedAttemptOrder.code,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: failedAttemptOrder.products[0].id,
                        quantity: failedAttemptOrder.products[0].quantity,
                        salePrice: failedAttemptOrder.products[0].salePrice
                    }
                ],
                method: "COD",
                shipping: 25000,
                voucher: matchedVoucher._id
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "EXCEED_TIME_OF_USAGE");
        t.snapshot(res.body);
    }
);

test.serial("POST / cannot recheckout with expired voucher", async t => {
    const voucher = await access.getVoucher({
        expiry: { $lt: new Date() },
        binRange: { $exists: false },
        used: false
    });

    t.truthy(voucher);

    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {
            address: {
                shipping: addresses.shipping[0],
                billing: addresses.billing[0]
            },
            cart: [
                {
                    id: failedAttemptOrder.products[0].id,
                    quantity: failedAttemptOrder.products[0].quantity,
                    salePrice: failedAttemptOrder.products[0].salePrice
                }
            ],
            method: "COD",
            shipping: 25000,
            voucher: voucher._id
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "VOUCHER_OR_NOT_VALID");
    t.snapshot(res.body);
});

test.serial(
    "POST / cannot recheckout with COD using voucher for CC",
    async t => {
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            binRange: { $exists: true },
            used: false,
            minimumPurchase: { $lte: failedAttemptOrder.products[0].salePrice }
        });

        t.truthy(voucher);

        const res = await request.post(
            config.api.checkout + "/order/" + failedAttemptOrder.code,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: failedAttemptOrder.products[0].id,
                        quantity: failedAttemptOrder.products[0].quantity,
                        salePrice: failedAttemptOrder.products[0].salePrice
                    }
                ],
                method: "COD",
                shipping: 25000,
                voucher: voucher._id
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "REQUIRES_CC_PAYMENT");
        t.snapshot(res.body);
    }
);

test.serial(
    "POST / cannot recheckout with voucher for Stripe using wrong bin range (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout with voucher on prod!");
            t.pass();
        } else {
            const voucher = await access.getVoucher({
                expiry: { $gte: new Date() },
                binRange: { $exists: true },
                used: false,
                minimumPurchase: {
                    $lte: failedAttemptOrder.products[0].salePrice
                }
            });

            t.truthy(voucher);

            const stripeData = {
                type: "card",
                "card[number]": "4000000000003063",
                "card[cvc]": "222",
                "card[exp_month]": "02",
                "card[exp_year]": "22",
                key: config.stripeKey
            };
            const stripeSource = await request
                .postFormUrl(
                    "/v1/sources",
                    stripeData,
                    t.context["cookie"],
                    config.stripeBase
                )
                .then(res => res.body);

            const res = await request.post(
                config.api.checkout + "/order/" + failedAttemptOrder.code,
                {
                    address: {
                        shipping: addresses.shipping[0],
                        billing: addresses.billing[0]
                    },
                    cart: [
                        {
                            id: failedAttemptOrder.products[0].id,
                            quantity: failedAttemptOrder.products[0].quantity,
                            salePrice: failedAttemptOrder.products[0].salePrice
                        }
                    ],
                    method: "STRIPE",
                    methodData: stripeSource,
                    shipping: 0,
                    voucher: voucher._id
                },
                t.context["cookie"]
            );

            t.deepEqual(res.statusCode, 400);
            t.deepEqual(res.body.message, "THIS_CC_NOT_ACCEPTABLE");
            t.snapshot(res.body);
        }
    }
);

test.serial("POST / cannot recheckout with already used voucher", async t => {
    const cookie = await request.getLogInCookie(
        config.testAccount.email_in,
        config.testAccount.password_in
    );

    const customer1 = await access.getCustomerInfo({
        email: config.testAccount.email_in.toLowerCase()
    });

    const voucher = await access.getUsedVoucher(
        {
            expiry: { $gte: new Date() },
            binRange: { $exists: false },
            used: false,
            oncePerAccount: true
        },
        customer1
    );

    t.truthy(voucher);

    const res = await request.post(
        config.api.checkout + "/order/" + failedAttemptOrder.code,
        {
            address: {
                shipping: addresses.shipping[0],
                billing: addresses.billing[0]
            },
            cart: [
                {
                    id: failedAttemptOrder.products[0].id,
                    quantity: failedAttemptOrder.products[0].quantity,
                    salePrice: failedAttemptOrder.products[0].salePrice
                }
            ],
            method: "COD",
            shipping: 25000,
            voucher: voucher._id
        },
        cookie
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "YOU_ALREADY_USED_THIS_VOUCHER");
    t.snapshot(res.body);
});

test.serial(
    "POST / cannot recheckout with voucher only used for other customer",
    async t => {
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: { $exists: false },
            customer: { $exists: true, $ne: customer._id }
        });

        t.truthy(voucher);

        const res = await request.post(
            config.api.checkout + "/order/" + failedAttemptOrder.code,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: failedAttemptOrder.products[0].id,
                        quantity: failedAttemptOrder.products[0].quantity,
                        salePrice: failedAttemptOrder.products[0].salePrice
                    }
                ],
                method: "COD",
                shipping: 25000,
                voucher: voucher._id
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "NOT_ALLOWED_TO_USE_VOUCHER");
        t.snapshot(res.body);
    }
);

// validate account credit

test.serial(
    "POST / cannot recheckout with with more than available credit",
    async t => {
        const account = await requestAccount.getAccountInfo(
            t.context["cookie"]
        );
        const res = await request.post(
            config.api.checkout + "/order/" + failedAttemptOrder.code,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: failedAttemptOrder.products[0].id,
                        quantity: failedAttemptOrder.products[0].quantity,
                        salePrice: failedAttemptOrder.products[0].salePrice
                    }
                ],
                method: "COD",
                shipping: 25000,
                accountCredit: account.accountCredit + 1
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "USER_SPEND_MORE_CREDIT_THAN_THEY_HAVE");
        t.snapshot(res.body);
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
