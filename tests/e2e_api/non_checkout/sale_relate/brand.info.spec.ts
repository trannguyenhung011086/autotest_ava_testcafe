import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";
import * as Model from "../../../../common/interface";

const request = new Utils.BrandUtils();

import test from "ava";

test("GET / brands directory", async t => {
    const res = await request.get(config.api.brands);

    const brands: Model.brands = res.body;

    t.deepEqual(res.statusCode, 200);

    for (const item of Object.keys(brands)) {
        let brand: Model.BrandItem;

        for (brand of brands[item]) {
            t.truthy(brand.id);
            t.truthy(brand.name);
            t.true(brand.slug.includes(brand.id));
        }
    }
});

test("GET / brand with no product", async t => {
    const brand = await request.getBrandWithNoProduct();

    t.truthy(brand.id);
    t.truthy(brand.name);
    t.truthy(brand.description);

    if (Object.keys(brand.meta).length > 0) {
        t.true(brand.meta.hasOwnProperty("title"));
        t.true(brand.meta.hasOwnProperty("description"));
        t.true(brand.meta.hasOwnProperty("content"));
    }

    t.deepEqual(brand.products.length, 0);
});

test("GET / brand with products", async t => {
    const brand = await request.getBrandWithProducts(config.api.potdSales);

    t.truthy(brand.id);
    t.truthy(brand.name);
    t.truthy(brand.description);

    if (Object.keys(brand.meta).length > 0) {
        t.true(brand.meta.hasOwnProperty("title"));
        t.true(brand.meta.hasOwnProperty("description"));
        t.true(brand.meta.hasOwnProperty("content"));
    }

    brand.products.forEach(product => {
        t.truthy(product.id);
        t.deepEqual(product.brand, brand.name);
        t.true(request.validateImage(product.image));
        t.true(request.validateImage(product.image2));
        t.deepEqual(typeof product.numberOfVariations, "number");
        t.true(product.quantity >= 0);
        t.true(product.queryParams.includes("?"));
        t.true(product.retailPrice >= product.salePrice);
        t.true(product.slug.includes(product.id));
        t.deepEqual(typeof product.soldOut, "boolean");
        t.truthy(product.title);
    });
});
