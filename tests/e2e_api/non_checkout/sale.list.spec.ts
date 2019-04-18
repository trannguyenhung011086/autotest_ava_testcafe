import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

const request = new Utils.SaleUtils();

import test from "ava";

test("Check all home sales", async t => {
    const res = await request.get(config.api.home);

    const home: Model.Home = res.body;

    t.true(home.hasOwnProperty("featured"));
    t.true(home.hasOwnProperty("today"));
    t.true(home.hasOwnProperty("current"));
    t.true(home.hasOwnProperty("potd"));
    t.true(home.hasOwnProperty("banners"));
    t.true(home.hasOwnProperty("upcoming"));

    if (home.banners.length > 0) {
        home.banners.forEach(banner => {
            t.true(request.validateImage(banner.image));
            t.truthy(banner.url);
        });
    }
});

for (const saleType of [
    config.api.currentSales,
    config.api.todaySales,
    config.api.featuredSales
]) {
    test("Check ongoing sales - " + saleType, async t => {
        const sales = await request.getSales(saleType);

        t.true(sales.length > 0);

        sales.forEach(sale => {
            request.validateSaleList(t, sale);
        });
    });
}

for (const cate of [
    config.api.cateAccessories,
    config.api.cateApparel,
    config.api.cateBagsShoes,
    config.api.cateHealthBeauty,
    config.api.cateHomeLifeStyle
]) {
    test("Check ongoing sales from " + cate, async t => {
        const sales = await request.getSales(cate + "/sales/current");

        t.true(sales.length > 0);

        sales.forEach(sale => {
            request.validateSaleList(t, sale);
        });
    });
}

test("Check international sales", async t => {
    const sales = await request.getSales(config.api.internationalSales);

    t.true(sales.length > 0);

    sales.forEach(sale => {
        request.validateSaleList(t, sale);
        t.true(sale.international);
    });
});

test("Check POTD sales", async t => {
    const sales = await request.getSales(config.api.potdSales);

    t.true(sales.length > 0);

    sales.forEach(sale => {
        request.validateSaleList(t, sale);
        t.truthy(sale.product.id);
        t.truthy(sale.product.brand);
        t.truthy(sale.product.title);
        t.true(sale.product.retailPrice >= sale.product.salePrice);
        t.truthy(sale.product.images);
        t.true(sale.slug.includes(sale.product.id));
    });
});

test("Check Upcoming sales", async t => {
    const dates = await request.getUpcomingSales();

    t.true(dates.length > 0);

    for (const date of dates) {
        t.truthy(date.date);
        t.truthy(date.year);
        t.truthy(date.sales);

        for (const sale of date.sales) {
            t.truthy(sale.id);
            t.truthy(sale.title);
            t.true(request.validateImage(sale.image));
            t.true(sale.slug.includes(sale.id));
            t.truthy(sale.categories);
            t.deepEqual(typeof sale.international, "boolean");
        }
    }
});
