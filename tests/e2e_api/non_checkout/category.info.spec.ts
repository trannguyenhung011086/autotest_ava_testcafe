import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

const request = new Utils.Helper();
const requestSale = new Utils.SaleUtils();

import test from "ava";

test("Get 500 error code when accessing invalid category ID", async t => {
    const resA = await request.get("/api/menus/items/INVALID-ID");

    t.deepEqual(resA.statusCode, 500);
    t.deepEqual(
        resA.body.error,
        "Argument passed in must be a single String of 12 bytes or a string of 24 hex characters"
    );

    if (process.env.NODE_ENV == "prod") {
        const resB = await request.get(
            "/api/menus/items/5b56d3448f0dd7c0480acd1c"
        );

        t.deepEqual(resB.statusCode, 500);
        t.deepEqual(
            resB.body.error,
            "Cannot read property 'subitems' of undefined"
        );
    }
});

test("Check top menu", async t => {
    const res = await request.get(config.api.cateMenu);

    t.deepEqual(res.statusCode, 200);

    const topMenu: Model.TopMenu = res.body;

    t.truthy(topMenu.id);
    t.deepEqual(topMenu.code, "TOP_NAV");
    t.deepEqual(topMenu.name, "Top Navigation");
    t.deepEqual(topMenu.displayName.vn, "Top Navigation");
    t.deepEqual(topMenu.displayName.en, "Top Navigation");
    t.truthy(topMenu.description);

    topMenu.items.forEach(item => {
        t.truthy(item.id);
        t.deepEqual(item.name, "");
        t.truthy(item.displayName.vn);
        t.truthy(item.displayName.en);
        t.truthy(item.type);
        t.true(item.slug.vn.includes(item.id));
        t.true(item.slug.en.includes(item.id));
    });
});

test("Check international cateogory on top menu when sales <= 5", async t => {
    const menu = (await request.get(config.api.cateMenu + "&salesCount=true"))
        .body;

    const sales = await requestSale.getSales(config.api.internationalSales);

    if (sales.length <= 5) {
        t.log("International sales <= 5 -> hidden");
        menu.items.forEach(item => {
            t.notDeepEqual(item.id, "5b56d3328f0dd7c0480acd38");
            t.notDeepEqual(item.type, "international");
        });
    } else {
        t.log("International sales > 5 -> displayed");
        t.deepEqual(
            menu.items[menu.items.length - 1].id,
            "5b56d3328f0dd7c0480acd38"
        );
        t.deepEqual(menu.items[menu.items.length - 1].type, "international");
    }
});

for (const cate of [
    config.api.cateAccessories,
    config.api.cateApparel,
    config.api.cateBagsShoes,
    config.api.cateHealthBeauty,
    config.api.cateHomeLifeStyle
]) {
    test("Check valid category ID - " + cate, async t => {
        const res = await request.get(cate);

        t.deepEqual(res.statusCode, 200);

        const menu: Model.CategoryMenu = res.body;
        await request.validateCategory(t, menu);
    });
}

for (const cate of [
    config.api.cateAccessories,
    config.api.cateApparel,
    config.api.cateBagsShoes,
    config.api.cateHealthBeauty,
    config.api.cateHomeLifeStyle
]) {
    test("Check featured sales from " + cate, async t => {
        const sales = await requestSale.getSales(cate + "/sales/featured");

        if (sales.length > 0) {
            for (const sale of sales) {
                await request.validateSale(t, sale);
            }
        } else {
            t.pass();
            t.log(cate + " does not set featured sale!");
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
    test("Check current sales from " + cate, async t => {
        const featured = await request.get(cate + "/sales/featured?limit=1");

        const sales = await requestSale.getSales(
            cate + "/sales/current?excludeId=" + featured.body.id
        );

        for (const sale of sales) {
            await request.validateSale(t, sale);
            t.notDeepEqual(sale.id, featured.body.id);
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
    test("Check today sales from " + cate, async t => {
        const featured = await request.get(cate + "/sales/featured?limit=1");

        const sales = await requestSale.getSales(
            cate + "/sales/today?excludeId=" + featured.body.id
        );

        for (const sale of sales) {
            await request.validateSale(t, sale);
            t.notDeepEqual(sale.id, featured.body.id);
        }
    });
}
