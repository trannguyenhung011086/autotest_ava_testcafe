import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let customer: Model.Customer;
let addresses: Model.Addresses;
const checkoutInput: Model.CheckoutInput = {};

const requestAddress = new Utils.AddressUtils();
const requestAccount = new Utils.AccountUtils();
const requestCart = new Utils.CartUtils();
const requestProduct = new Utils.ProductUtils();
const request = new Utils.CheckoutUtils();
const access = new Utils.DbAccessUtils();
const accessRedis = new Utils.RedisAccessUtils();

import test from "ava";

test.before(async t => {
    t.context["cookie"] = await request.getLogInCookie(
        config.testAccount.email_ex[4],
        config.testAccount.password_ex
    );

    addresses = await requestAddress.getAddresses(t.context["cookie"]);
    customer = await access.getCustomerInfo({
        email: config.testAccount.email_ex[4].toLowerCase()
    });
});

test.beforeEach(async t => {
    await requestCart.emptyCart(t.context["cookie"]);
});

// validate required data

test.serial("Get 500 error code when checkout with invalid cookie", async t => {
    const item = await requestProduct.getInStockProduct(
        config.api.todaySales,
        1
    );

    await requestCart.addToCart(item.id, t.context["cookie"]);
    const account = await requestAccount.getAccountInfo(t.context["cookie"]);

    const res = await request.post(
        config.api.checkout,
        {
            address: {
                shipping: addresses.shipping[0],
                billing: addresses.billing[0]
            },
            cart: account.cart,
            method: "FREE"
        },
        "leflair.connect2.sid=test"
    );

    t.deepEqual(res.statusCode, 500);
    t.snapshot(res.body);
});

test.serial("Get 500 error code when checkout with empty data", async t => {
    const res = await request.post(
        config.api.checkout,
        {},
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 500);
    t.snapshot(res.body);
});

test.serial("Get 400 error code when checkout without address", async t => {
    const res = await request.post(
        config.api.checkout,
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

test.serial("Get 400 error code when checkout with empty cart", async t => {
    const res = await request.post(
        config.api.checkout,
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
    "Get 400 error code when checkout with invalid phone and tax code",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
            1
        );
        let res = await request.post(
            config.api.cart,
            {
                productId: item.id
            },
            t.context["cookie"]
        );
        const cart: Model.Cart = res.body;

        res = await request.post(
            config.api.checkout,
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
                        id: cart.id,
                        quantity: cart.quantity,
                        salePrice: cart.salePrice
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

test.serial(
    "Get 400 error code when checkout without payment method",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
            1
        );
        let res = await request.post(
            config.api.cart,
            {
                productId: item.id
            },
            t.context["cookie"]
        );
        const cart: Model.Cart = res.body;

        res = await request.post(
            config.api.checkout,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: cart.id,
                        quantity: cart.quantity,
                        salePrice: cart.salePrice
                    }
                ]
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.true(res.body.message.includes("PLEASE_SELECT_A_PAYMENT_METHOD"));
        t.snapshot(res.body);
    }
);

// validate cart

test.serial(
    "Get 400 error code when checkout with mismatched cart",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
            1
        );
        let res = await request.post(
            config.api.cart,
            {
                productId: item.id
            },
            t.context["cookie"]
        );
        const cart: Model.Cart = res.body;

        res = await request.post(
            config.api.checkout,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: cart.id,
                        quantity: cart.quantity,
                        salePrice: cart.salePrice
                    },
                    {
                        id: cart.id,
                        quantity: cart.quantity,
                        salePrice: cart.salePrice
                    }
                ],
                method: "FREE"
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "CART_MISMATCH");
    }
);

test.serial(
    "Get 400 error code when checkout with mismatched quantity",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
            1
        );
        let res = await request.post(
            config.api.cart,
            {
                productId: item.id
            },
            t.context["cookie"]
        );
        const cart: Model.Cart = res.body;

        res = await request.post(
            config.api.checkout,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: cart.id,
                        quantity: 2,
                        salePrice: cart.salePrice
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
    }
);

test.serial(
    "Get 400 error code when checkout with mismatched price",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
            1
        );
        let res = await request.post(
            config.api.cart,
            {
                productId: item.id
            },
            t.context["cookie"]
        );
        const cart: Model.Cart = res.body;

        res = await request.post(
            config.api.checkout,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: cart.id,
                        quantity: 1,
                        salePrice: cart.salePrice - 1
                    }
                ],
                method: "FREE"
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message[0].message, "PRICE_MISMATCH");
    }
);

test.serial(
    "Get 400 error code when checkout with invalid product",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
            1
        );
        let res = await request.post(
            config.api.cart,
            {
                productId: item.id
            },
            t.context["cookie"]
        );
        const cart: Model.Cart = res.body;

        res = await request.post(
            config.api.checkout,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: [
                    {
                        id: "INVALID-ID",
                        quantity: 1,
                        salePrice: cart.salePrice
                    }
                ],
                method: "FREE"
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(
            res.body.message[0].message,
            "CART_MISMATCH_CANT_FIND_PRODUCT"
        );
    }
);

test.serial(
    "Get 400 error code when checkout with more than 8 unique products",
    async t => {
        const items = await requestProduct.getInStockProducts(
            config.api.todaySales,
            1
        );

        for (const item of items) {
            await requestCart.addToCart(item.id, t.context["cookie"], false);
        }
        const account = await requestAccount.getAccountInfo(
            t.context["cookie"]
        );

        if (account.cart.length <= 8) {
            throw "Cart does not have more than 8 unique products!";
        }

        const res = await request.post(
            config.api.checkout,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: account.cart,
                method: "FREE"
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "CART_EXCEEDS_THE_MAXIMUM_SIZE");
        t.deepEqual(res.body.values.quantity, 8);
        t.snapshot(res.body);
    }
);

// validate availability

test.serial.skip(
    "Get 400 error when checkout with removed product",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.currentSales,
            1
        );
        await requestCart.addToCart(item.id, t.context["cookie"]);

        const account = await requestAccount.getAccountInfo(
            t.context["cookie"]
        );

        await requestCart.emptyCart(t.context["cookie"]);

        const res = await request.post(
            config.api.checkout,
            {
                address: {
                    shipping: addresses.shipping[0],
                    billing: addresses.billing[0]
                },
                cart: account.cart,
                method: "FREE"
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message[0].message, "THE_ITEM_IS_NOT_FOUND");
        t.deepEqual(res.body.message[0].values.title, item.name);
    }
); // wait for WWW-757

test.serial.skip(
    "Get 400 error code when checkout with sold out product (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const item = await requestProduct.getInStockProduct(
                config.api.currentSales,
                1
            );
            let redisItem: string = await accessRedis.getKey(
                "nsId:" + item.nsId
            );
            const originalQuantity: number = redisItem["quantity"];

            try {
                await requestCart.addToCart(item.id, t.context["cookie"]);
                const account = await requestAccount.getAccountInfo(
                    t.context["cookie"]
                );

                redisItem["quantity"] = 0;
                await accessRedis.setValue(
                    "nsId:" + item.nsId,
                    JSON.stringify(redisItem)
                );

                redisItem = await accessRedis.getKey("nsId:" + item.nsId);
                t.deepEqual(redisItem["quantity"], 0);

                const res = await request.post(
                    config.api.checkout,
                    {
                        address: {
                            shipping: addresses.shipping[0],
                            billing: addresses.billing[0]
                        },
                        cart: account.cart,
                        method: "FREE"
                    },
                    t.context["cookie"]
                );

                t.deepEqual(res.statusCode, 400);
                t.deepEqual(
                    res.body.message[0].message,
                    "TITLE_IS_OUT_OF_STOCK"
                );
                t.deepEqual(res.body.message[0].values.title, item.name);
            } catch (err) {
                throw err;
            } finally {
                redisItem["quantity"] = originalQuantity;
                await accessRedis.setValue(
                    "nsId:" + item.nsId,
                    JSON.stringify(redisItem)
                );
            }
        }
    }
); // wait for WWW-757

test.serial.skip(
    "Get 400 error code when checkout with limited stock product (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const item = await requestProduct.getInStockProduct(
                config.api.currentSales,
                2
            );
            let redisItem: string = await accessRedis.getKey(
                "nsId:" + item.nsId
            );
            const originalQuantity: number = redisItem["quantity"];

            try {
                await requestCart.addToCart(item.id, t.context["cookie"]);
                await requestCart.addToCart(item.id, t.context["cookie"]);
                const account = await requestAccount.getAccountInfo(
                    t.context["cookie"]
                );

                redisItem["quantity"] = 1;
                await accessRedis.setValue(
                    "nsId:" + item.nsId,
                    JSON.stringify(redisItem)
                );

                redisItem = await accessRedis.getKey("nsId:" + item.nsId);
                t.deepEqual(redisItem["quantity"], 1);

                const res = await request.post(
                    config.api.checkout,
                    {
                        address: {
                            shipping: addresses.shipping[0],
                            billing: addresses.billing[0]
                        },
                        cart: account.cart,
                        method: "FREE"
                    },
                    t.context["cookie"]
                );

                t.deepEqual(res.statusCode, 400);
                t.deepEqual(
                    res.body.message[0].message,
                    "ONLY_LIMITED_UNITS_IN_STOCK"
                );
                t.deepEqual(res.body.message[0].values.title, item.name);
                t.deepEqual(res.body.data.cart[0].quantity, 1);
                t.deepEqual(res.body.data.cart[0].availableQuantity, 1);
            } catch (err) {
                throw err;
            } finally {
                redisItem["quantity"] = originalQuantity;
                await accessRedis.setValue(
                    "nsId:" + item.nsId,
                    JSON.stringify(redisItem)
                );
            }
        }
    }
); // wait for WWW-757

test.serial(
    "Get 400 error code when checkout with sale ended product (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout on prod!");
            t.pass();
        } else {
            const item = await requestProduct.getInStockProductInfo(
                config.api.currentSales
            );
            let redisItem: string = await accessRedis.getKey(
                "productId:" + item.id
            );
            let originalEnd: string = redisItem["event"]["endDate"];

            try {
                await requestCart.addToCart(
                    item.products[0].id,
                    t.context["cookie"]
                );
                const account = await requestAccount.getAccountInfo(
                    t.context["cookie"]
                );

                redisItem["event"]["endDate"] = "2019-02-18T01:00:00.000Z";
                await accessRedis.setValue(
                    "productId:" + item.id,
                    JSON.stringify(redisItem)
                );

                redisItem = await accessRedis.getKey("productId:" + item.id);
                t.deepEqual(
                    redisItem["event"]["endDate"],
                    "2019-02-18T01:00:00.000Z"
                );

                const res = await request.post(
                    config.api.checkout,
                    {
                        address: {
                            shipping: addresses.shipping[0],
                            billing: addresses.billing[0]
                        },
                        cart: account.cart,
                        method: "FREE"
                    },
                    t.context["cookie"]
                );

                t.deepEqual(res.statusCode, 400);
                t.deepEqual(
                    res.body.message[0].message,
                    "THE_SALE_FOR_TITLE_HAS_ENDED"
                );
                t.deepEqual(res.body.message[0].values.title, item.title);
            } catch (err) {
                throw err;
            } finally {
                redisItem["event"]["endDate"] = originalEnd;
                await accessRedis.setValue(
                    "productId:" + item.id,
                    JSON.stringify(redisItem)
                );
            }
        }
    }
);

// validate account credit

test.serial(
    "Get 400 error code when checkout with more than available credit",
    async t => {
        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
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
                method: "COD",
                shipping: 25000,
                accountCredit: account.accountCredit + 1
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "USER_SPEND_MORE_CREDIT_THAN_THEY_HAVE");
        t.deepEqual(res.body.data.accountCredit, account.accountCredit);
        t.snapshot(res.body);
    }
);

// validate voucher

test.serial(
    "Get 400 error code when checkout with voucher not meeting min items",
    async t => {
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            numberOfItems: { $gte: 2 }
        });

        t.truthy(voucher);

        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
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
                method: "COD",
                shipping: 25000,
                voucher: voucher._id,
                accountCredit: account.accountCredit
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
    "Get 400 error code when checkout with voucher not applied for today",
    async t => {
        const today = new Date().getDay();
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            specificDays: { $size: 1 },
            "specificDays.0": { $exists: true, $ne: today }
        });

        t.truthy(voucher);

        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
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
                method: "COD",
                shipping: 25000,
                voucher: voucher._id,
                accountCredit: account.accountCredit
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
    "Get 400 error code when checkout with voucher not meeting min purchase",
    async t => {
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            binRange: { $exists: false },
            minimumPurchase: { $gt: 500000 }
        });

        t.truthy(voucher);

        const item = await requestProduct.getProductWithCountry(
            "VN",
            0,
            500000
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
                method: "COD",
                shipping: 25000,
                voucher: voucher._id,
                accountCredit: account.accountCredit
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "TOTAL_VALUE_LESS_THAN_VOUCHER_MINIMUM");
        t.snapshot(res.body);
    }
);

test.serial(
    "Get 400 error code when checkout with voucher exceeding number of usage (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout with voucher on prod!");
            t.pass();
        } else {
            const voucher = await access.getNotUsedVoucher(
                {
                    expiry: { $gte: new Date() },
                    multipleUser: true,
                    numberOfUsage: 1,
                    used: false
                },
                customer
            );

            t.truthy(voucher);

            const item = await requestProduct.getInStockProduct(
                config.api.currentSales,
                2
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);

            checkoutInput.account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );
            checkoutInput.addresses = addresses;
            checkoutInput.voucherId = voucher._id;

            await request.checkoutCod(checkoutInput, t.context["cookie"]);

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
                    method: "COD",
                    shipping: 25000,
                    voucher: voucher._id,
                    accountCredit: account.accountCredit
                },
                t.context["cookie"]
            );

            t.deepEqual(res.statusCode, 400);
            t.deepEqual(res.body.message, "EXCEED_TIME_OF_USAGE");
            t.snapshot(res.body);
        }
    }
);

test.serial(
    "Get 400 error code when checkout with expired voucher",
    async t => {
        const voucher = await access.getVoucher({
            expiry: { $lt: new Date() },
            binRange: { $exists: false },
            used: false
        });

        t.truthy(voucher);

        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
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
                method: "COD",
                shipping: 25000,
                voucher: voucher._id,
                accountCredit: account.accountCredit
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "VOUCHER_NOT_EXISTS");
        t.snapshot(res.body);
    }
);

test.serial(
    "Get 400 error code when checkout with redeemed voucher",
    async t => {
        const voucher = await access.getVoucher({
            expiry: { $lt: new Date() },
            binRange: { $exists: false },
            used: true
        });

        t.truthy(voucher);

        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
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
                method: "COD",
                shipping: 25000,
                voucher: voucher._id,
                accountCredit: account.accountCredit
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "VOUCHER_NOT_EXISTS");
        t.snapshot(res.body);
    }
);

test.serial(
    "Get 400 error code when checkout with COD using voucher for CC",
    async t => {
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            binRange: { $exists: true },
            used: false,
            minimumPurchase: 0
        });

        t.truthy(voucher);

        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
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
                method: "COD",
                shipping: 25000,
                voucher: voucher._id,
                accountCredit: account.accountCredit
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "REQUIRES_CC_PAYMENT");
        t.snapshot(res.body);
    }
);

test.serial(
    "Get 400 error code when checkout with voucher for Stripe using wrong bin range (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout with voucher on prod!");
            t.pass();
        } else {
            const voucher = await access.getVoucher({
                expiry: { $gte: new Date() },
                binRange: { $exists: true, $not: /400000/ },
                used: false,
                minimumPurchase: 0
            });

            t.truthy(voucher);

            const item = await requestProduct.getInStockProduct(
                config.api.internationalSales,
                1
            );
            await requestCart.addToCart(item.id, t.context["cookie"]);
            const account = await requestAccount.getAccountInfo(
                t.context["cookie"]
            );

            const stripeData = {
                type: "card",
                "card[number]": "4000000000000093",
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
                config.api.checkout,
                {
                    address: {
                        shipping: addresses.shipping[0],
                        billing: addresses.billing[0]
                    },
                    cart: account.cart,
                    method: "STRIPE",
                    methodData: stripeSource,
                    shipping: 0,
                    voucher: voucher._id,
                    accountCredit: account.accountCredit
                },
                t.context["cookie"]
            );

            t.deepEqual(res.statusCode, 400);
            t.deepEqual(res.body.message, "THIS_CC_NOT_ACCEPTABLE");
            t.snapshot(res.body);
        }
    }
);

test.serial(
    "Get 400 error code when checkout with already used voucher (skip-prod)",
    async t => {
        if (process.env.NODE_ENV == "prod") {
            t.log("Skip checkout with voucher on prod!");
            t.pass();
        } else {
            const cookie = await request.getLogInCookie(
                config.testAccount.email_ex[1],
                config.testAccount.password_ex
            );

            const customer1 = await access.getCustomerInfo({
                email: config.testAccount.email_ex[1].toLowerCase()
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

            const item = await requestProduct.getInStockProduct(
                config.api.currentSales,
                1
            );
            await requestCart.addToCart(item.id, cookie);
            const account = await requestAccount.getAccountInfo(cookie);

            const res = await request.post(
                config.api.checkout,
                {
                    address: {
                        shipping: addresses.shipping[0],
                        billing: addresses.billing[0]
                    },
                    cart: account.cart,
                    method: "COD",
                    shipping: 25000,
                    voucher: voucher._id,
                    accountCredit: account.accountCredit
                },
                cookie
            );

            t.deepEqual(res.statusCode, 400);
            t.deepEqual(res.body.message, "YOU_ALREADY_USED_THIS_VOUCHER");
            t.snapshot(res.body);
        }
    }
); // wait for WWW-490

test.serial(
    "Get 400 error code when checkout with voucher only used for other customer",
    async t => {
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            used: false,
            customer: { $exists: true, $ne: customer._id }
        });

        t.truthy(voucher);

        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
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
                method: "COD",
                shipping: 25000,
                voucher: voucher._id,
                accountCredit: account.accountCredit
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "NOT_ALLOWED_TO_USE_VOUCHER");
        t.snapshot(res.body);
    }
);

test.serial(
    "Get 400 error code when checkout with voucher used by another customer",
    async t => {
        const voucherList = await access.getVoucherList({
            oncePerAccountForCampaign: false,
            used: false,
            expiry: { $gt: new Date() },
            multipleUser: false,
            customer: { $exists: false },
            numberOfItems: 0,
            binRange: { $exists: false }
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

        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
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
                method: "COD",
                shipping: 25000,
                voucher: matched._id,
                accountCredit: account.accountCredit
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "VOUCHER_ALREADY_USED");
        t.snapshot(res.body);
    }
);

test.serial(
    "Get 400 error code when checkout with more than 1 voucher in a campaign (skip-prod)",
    async t => {
        const voucher = await access.getVoucher({
            oncePerAccountForCampaign: true,
            used: false,
            campaign: "Grab Rewards Premium "
        });

        t.truthy(voucher);

        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
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
                method: "COD",
                shipping: 25000,
                voucher: voucher._id,
                accountCredit: account.accountCredit
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "VOUCHER_PER_CAMPAIGN");
        t.snapshot(res.body);
    }
);

test.serial(
    "Get 400 error code when checkout with voucher for expired secret campaign",
    async t => {
        const voucher = await access.getVoucher({
            webCampaign: { $exists: true },
            expiry: { $lt: new Date() }
        });

        t.truthy(voucher);

        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
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
                method: "COD",
                shipping: 25000,
                voucher: voucher._id,
                accountCredit: account.accountCredit
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "VOUCHER_NOT_EXISTS");
        t.snapshot(res.body);
    }
);

test.serial(
    "Get 400 error code when checkout with voucher for new customer",
    async t => {
        const voucher = await access.getVoucher({
            expiry: { $gte: new Date() },
            binRange: { $exists: false },
            minimumPurchase: 0,
            forNewCustomer: true
        });

        t.truthy(voucher);

        const item = await requestProduct.getInStockProduct(
            config.api.todaySales,
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
                method: "COD",
                shipping: 25000,
                voucher: voucher._id,
                accountCredit: account.accountCredit
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "VOUCHER_ONLY_FOR_NEW_CUSTOMER");
        t.snapshot(res.body);
    }
);
