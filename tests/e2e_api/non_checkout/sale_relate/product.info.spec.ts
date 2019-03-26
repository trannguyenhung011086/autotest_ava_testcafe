import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";

const request = new Utils.ProductUtils();
const accessDb = new Utils.DbAccessUtils();
const accessRedis = new Utils.RedisAccessUtils();

import test from "ava";

test("GET / invalid product ID", async t => {
    const res = await request.get(config.api.product + "INVALID-ID");

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "PRODUCT_NOT_FOUND");
    t.snapshot(res.body);
});

for (const saleType of [
    config.api.currentSales,
    config.api.todaySales,
    config.api.featuredSales,
    config.api.internationalSales
]) {
    test("GET / valid product from ongoing sale " + saleType, async t => {
        const products = await request.getProducts(saleType);

        t.true(products.length > 0);

        for (let i = 0; i < 15; i++) {
            const random = Math.floor(Math.random() * products.length);
            const res = await request.getProductInfo(products[random].id);

            await request.validateProductInfo(t, res);
        }
    });
}

for (const cate of [
    config.api.cateAccessories,
    config.api.cateApparel,
    config.api.cateBagsShoes,
    config.api.cateHealthBeauty,
    config.api.cateHomeLifeStyle
]) {
    test("GET / valid product from current sale of " + cate, async t => {
        const products = await request.getProducts(cate + "/sales/current");

        t.true(products.length > 0);

        for (let i = 0; i < 15; i++) {
            const random = Math.floor(Math.random() * products.length);
            const res = await request.getProductInfo(products[random].id);

            await request.validateProductInfo(t, res);
        }
    });
}

for (const cate of [
    config.api.cateAccessories,
    config.api.cateApparel,
    config.api.cateBagsShoes,
    config.api.cateHealthBeauty,
    config.api.cateHomeLifeStyle
]) {
    test("GET / valid product from today sale of " + cate, async t => {
        const products = await request.getProducts(cate + "/sales/today");

        t.true(products.length > 0);

        for (let i = 0; i < 15; i++) {
            const random = Math.floor(Math.random() * products.length);
            const res = await request.getProductInfo(products[random].id);

            await request.validateProductInfo(t, res);
        }
    });
}

for (const cate of [
    config.api.cateAccessories,
    config.api.cateApparel,
    config.api.cateBagsShoes,
    config.api.cateHealthBeauty,
    config.api.cateHomeLifeStyle
]) {
    test("GET / valid product from featured sale of " + cate, async t => {
        const products = await request.getProducts(cate + "/sales/featured");

        t.true(products.length > 0);

        for (let i = 0; i < 15; i++) {
            const random = Math.floor(Math.random() * products.length);
            const res = await request.getProductInfo(products[random].id);

            await request.validateProductInfo(t, res);
        }
    });
}

test("GET / valid product from POTD", async t => {
    const products = await request.getProducts(config.api.potdSales);

    t.true(products.length > 0);

    for (const product of products) {
        const res = await request.getProductInfo(product.id);

        await request.validateProductInfo(t, res);
        t.true(res.sale.potd);
    }
});

test("GET / sold out product", async t => {
    const product = await request.getSoldOutProductInfo(
        config.api.currentSales
    );

    await request.validateProductInfo(t, product);

    for (const item of product.products) {
        t.false(item.inStock);
        t.true(item.quantity <= 0);
        t.true(item.isVirtual);
    }
    if (product.sizes.length > 0) {
        for (const size of product.sizes) {
            t.true(size.soldOut);
        }
    }
    if (product.colors.length > 0) {
        for (const color of product.colors) {
            t.true(color.soldOut);
        }
    }
});

test("GET / virtual product", async t => {
    const product = await request.getVirtualBulkyProductInfo(
        config.api.currentSales,
        true,
        false
    );

    await request.validateProductInfo(t, product);

    for (const item of product.products) {
        t.true(item.isVirtual);
        t.deepEqual(item.quantityAvailable, 0);
    }
});

test("GET / non-virtual non-bulky product", async t => {
    const product = await request.getVirtualBulkyProductInfo(
        config.api.currentSales,
        false,
        false
    );

    await request.validateProductInfo(t, product);

    for (const item of product.products) {
        t.false(item.isVirtual);
        t.true(item.quantityAvailable > 0);
        t.false(item.isBulky);
    }

    const productQuery = await accessDb.getProduct({
        "variations.nsId": product.products[0].nsId
    });

    t.truthy(productQuery);

    t.false(config.bulkyTypeList1.includes(productQuery.type));
    t.false(config.bulkyTypeList2.includes(productQuery.type));
});

test("GET / bulky product", async t => {
    const product = await request.getVirtualBulkyProductInfo(
        config.api.currentSales,
        true,
        true
    );

    await request.validateProductInfo(t, product);

    const productQuery = await accessDb.getProduct({
        "variations.nsId": product.products[0].nsId
    });

    t.truthy(productQuery);

    const isNameContain = config.bulkyNameList.some(name =>
        product.title.includes(name)
    );

    if (isNameContain) {
        t.log("bulky type list 1");
        t.true(config.bulkyTypeList1.includes(productQuery.type.toString()));
    } else {
        t.log("bulky type list 2");
        t.true(config.bulkyTypeList2.includes(productQuery.type.toString()));
    }
});

test("GET / product with sizes", async t => {
    const product = await request.getProductInfoWithSizes(
        config.api.cateApparel + "/sales/current"
    );

    await request.validateProductInfo(t, product);

    for (const size of product.sizes) {
        t.truthy(size.availableColors);
        t.truthy(size.name);
        t.deepEqual(typeof size.quantity, "number");
        t.deepEqual(typeof size.soldOut, "boolean");
    }
});

test("GET / product with colors", async t => {
    const product = await request.getProductInfoWithColors(
        config.api.cateApparel + "/sales/current"
    );

    await request.validateProductInfo(t, product);

    for (const color of product.colors) {
        t.truthy(color.availableSizes);
        t.truthy(color.name);
        t.deepEqual(typeof color.soldOut, "boolean");

        if (color.hex) {
            t.true(color.hex.includes("#"));
        }
        if (color.hidden) {
            t.deepEqual(typeof color.hidden, "boolean");
        }

        const res = await request.get(
            config.api.product +
                "view-product/" +
                product.id +
                "/" +
                encodeURIComponent(color.name)
        );

        t.deepEqual(res.statusCode, 200);
    }
});

test("GET / product with no color and size", async t => {
    const product = await request.getProductInfoNoColorSize(
        config.api.currentSales
    );

    await request.validateProductInfo(t, product);

    t.true(request.validateImage(product.images["All"][0]));
    t.deepEqual(product.products[0].imageKey, "All");
});

test("GET / product of sale not started (skip-prod)", async t => {
    if (process.env.NODE_ENV == "prod") {
        t.log("Skip check on prod!");
        t.pass();
    } else {
        const products = await request.getProducts(config.api.todaySales);

        let redisItem: string = await accessRedis.getKey(
            "productId:" + products[0].id
        );
        const originalStart: string = redisItem["event"]["startDate"];

        try {
            redisItem["event"]["startDate"] = "2030-02-22T01:00:00.000Z";
            await accessRedis.setValue(
                "productId:" + products[0].id,
                JSON.stringify(redisItem)
            );

            redisItem = await accessRedis.getKey("productId:" + products[0].id);
            t.deepEqual(
                redisItem["event"]["startDate"],
                "2030-02-22T01:00:00.000Z"
            );

            const res = await request.get(config.api.product + products[0].id);

            t.deepEqual(res.statusCode, 404);
            t.deepEqual(res.body.message, "SALE_NOT_FOUND");
            t.snapshot(res.body);
        } catch (err) {
            throw err;
        } finally {
            redisItem["event"]["startDate"] = originalStart;
            await accessRedis.setValue(
                "productId:" + products[0].id,
                JSON.stringify(redisItem)
            );
        }
    }
});

test("GET / product of sale ended (skip-prod)", async t => {
    if (process.env.NODE_ENV == "prod") {
        t.log("Skip check on prod!");
        t.pass();
    } else {
        const products = await request.getProducts(config.api.currentSales);

        let redisItem: string = await accessRedis.getKey(
            "productId:" + products[0].id
        );
        const originalEnd: string = redisItem["event"]["endDate"];

        try {
            redisItem["event"]["endDate"] = "2019-02-18T01:00:00.000Z";
            await accessRedis.setValue(
                "productId:" + products[0].id,
                JSON.stringify(redisItem)
            );

            redisItem = await accessRedis.getKey("productId:" + products[0].id);
            t.deepEqual(
                redisItem["event"]["endDate"],
                "2019-02-18T01:00:00.000Z"
            );

            const res = await request.get(config.api.product + products[0].id);

            t.deepEqual(res.statusCode, 404);
            t.deepEqual(res.body.message, "SALE_HAS_ENDED");
            t.snapshot(res.body);
        } catch (err) {
            throw err;
        } finally {
            redisItem["event"]["endDate"] = originalEnd;
            await accessRedis.setValue(
                "productId:" + products[0].id,
                JSON.stringify(redisItem)
            );
        }
    }
});
