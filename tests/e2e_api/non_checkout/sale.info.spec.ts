import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

const request = new Utils.SaleUtils();
const access = new Utils.DbAccessUtils();

import test from "ava";

test("GET / invalid sale ID", async t => {
    const res = await request.get(config.api.sales + "INVALID-ID");
    t.snapshot(res.body);

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "INVALID_SALE_ID");
});

test("GET / no sale matching", async t => {
    const res = await request.get(
        config.api.sales + "invalid-5bd6c3137cf0476b22488d21"
    );
    t.snapshot(res.body);

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "NO_SALE_MATCHING");
});

test("GET / sale not started", async t => {
    const futureSale = await access.getSale({
        startDate: { $gt: new Date() }
    });
    const res = await request.get(config.api.sales + futureSale._id);
    t.snapshot(res.body);

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "SALE_NOT_FOUND");
});

test("GET / sale has ended", async t => {
    const endedSale = await access.getSale({
        endDate: { $lt: new Date() }
    });
    const res = await request.get(config.api.sales + endedSale._id);
    t.snapshot(res.body);

    t.deepEqual(res.statusCode, 410);
    t.deepEqual(res.body.message, "SALE_HAS_ENDED");
});

test("GET / invalid upcoming sale ID", async t => {
    const res = await request.get(config.api.upcomingSale + "INVALID-ID");
    t.snapshot(res.body);

    t.deepEqual(res.statusCode, 500);
});

test("GET / no upcoming sale matching", async t => {
    const res = await request.get(
        config.api.upcomingSale + "566979b534cbcd100061967b"
    );
    t.snapshot(res.body);

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "NO_UPCOMING_SALE_MATCHING");
});

test("GET / upcoming sale ended", async t => {
    const endedSale = await access.getSale({
        endDate: { $lt: new Date() }
    });
    const res = await request.get(config.api.upcomingSale + endedSale._id);
    t.snapshot(res.body);

    t.deepEqual(res.statusCode, 410);
    t.deepEqual(res.body.message, "SALE_HAS_ENDED");
});

for (const saleType of [
    config.api.currentSales,
    config.api.todaySales,
    config.api.featuredSales,
    config.api.internationalSales,
    config.api.potdSales
]) {
    test("GET / valid ongoing sale - " + saleType, async t => {
        const sales = await request.getSales(saleType);

        for (const sale of sales) {
            const res = await request.getSaleInfo(sale.id);
            request.validateSaleInfo(t, res);

            t.deepEqual(res.id, sale.id);
            t.deepEqual(res.endTime, sale.endTime);
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
    test("GET / valid ongoing sale from " + cate, async t => {
        const sales = await request.getSales(cate + "/sales/current");

        for (const sale of sales) {
            const res = await request.getSaleInfo(sale.id);
            request.validateSaleInfo(t, res);

            t.deepEqual(res.id, sale.id);
            t.deepEqual(res.endTime, sale.endTime);
        }
    });
}

test("GET / valid ongoing sale ID with filter by category", async t => {
    const sales = await request.getSales(config.api.todaySales);

    for (const sale of sales) {
        const saleInfo = await request.getSaleInfo(sale.id);
        const filteredSale = await request.getSaleInfo(
            saleInfo.id + "?category=" + saleInfo.filter.category[0].value
        );

        filteredSale.products.forEach(product => {
            t.deepEqual(product.category, saleInfo.filter.category[0].display);
        });
    }
});

test("GET / valid ongoing sale ID with filter by size", async t => {
    const sales = await request.getSales(config.api.currentSales);

    for (const sale of sales) {
        const saleInfo = await request.getSaleInfo(sale.id);

        if (saleInfo.filter.size.length > 1) {
            const filteredSale = await request.getSaleInfo(
                saleInfo.id + "?size=" + saleInfo.filter.size[0].value
            );

            filteredSale.products.forEach(product => {
                t.deepEqual(product.size, saleInfo.filter.size[0].display);
            });
        }
    }
});

test("GET / valid ongoing sale ID with filter by brand", async t => {
    const sales = await request.getSales(config.api.currentSales);

    for (const sale of sales) {
        const saleInfo = await request.getSaleInfo(sale.id);

        if (saleInfo.filter.brand.length > 1) {
            const filteredSale = await request.getSaleInfo(
                saleInfo.id + "?brand=" + saleInfo.filter.brand[0].value
            );

            filteredSale.products.forEach(product => {
                t.deepEqual(product.brand, saleInfo.filter.brand[0].display);
            });
        }
    }
});

test("GET / valid upcoming sale ID", async t => {
    const dates = await request.getUpcomingSales();

    t.true(dates.length > 0);

    for (const date of dates) {
        for (const sale of date.sales) {
            t.true(date.sales.length > 0);

            const res = await request.get(config.api.upcomingSale + sale.id);
            const upcoming: Model.UpcomingInfo = res.body;

            t.deepEqual(res.statusCode, 200);
            t.deepEqual(upcoming.id, sale.id);

            if (upcoming.description) {
                t.truthy(upcoming.description);
            }

            t.true(request.validateImage(upcoming.image));
            t.truthy(upcoming.title);
            t.true(
                new Date(upcoming.startTime).getTime() > new Date().getTime()
            );
        }
    }
});
