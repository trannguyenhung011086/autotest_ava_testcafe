import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";
import * as convert from "xml-js";

let sitemap: Model.Sitemap;

const helper = new Utils.Helper();
const requestBrands = new Utils.BrandUtils();
const requestProducts = new Utils.ProductUtils();

import test from "ava";

test("GET / get sitemap", async t => {
    const res = await helper.getPlain(config.api.sitemap);

    t.deepEqual(res.statusCode, 200);

    const result: any = convert.xml2js(res.body, { compact: true });
    sitemap = result;

    t.deepEqual(sitemap._declaration._attributes.encoding, "UTF-8");
    t.deepEqual(sitemap._declaration._attributes.version, "1.0");
    t.deepEqual(
        sitemap.urlset._attributes.xmlns,
        "http://www.sitemaps.org/schemas/sitemap/0.9"
    );
    t.deepEqual(
        sitemap.urlset._attributes["xmlns:image"],
        "http://www.google.com/schemas/sitemap-image/1.1"
    );
    t.deepEqual(
        sitemap.urlset._attributes["xmlns:mobile"],
        "http://www.google.com/schemas/sitemap-mobile/1.0"
    );
    t.deepEqual(
        sitemap.urlset._attributes["xmlns:news"],
        "http://www.google.com/schemas/sitemap-news/0.9"
    );
    t.deepEqual(
        sitemap.urlset._attributes["xmlns:video"],
        "http://www.google.com/schemas/sitemap-video/1.1"
    );
    t.deepEqual(
        sitemap.urlset._attributes["xmlns:xhtml"],
        "http://www.w3.org/1999/xhtml"
    );

    let categories = 0;
    let brands = 0;
    let products = 0;
    let sales = 0;

    sitemap.urlset.url.forEach(url => {
        t.regex(url.loc._text, /https:\/\/www.leflair.vn/);
        t.regex(url.lastmod._text, /^\d{4}-\d{2}-\d{2}$/);
        t.deepEqual(url.changefreq._text, "daily");
        t.deepEqual(url.priority._text, "0.8");

        if (url.loc._text.match(/\/categories\/.+/)) {
            categories += 1;
        }
        if (url.loc._text.match(/\/brands\/.+/)) {
            brands += 1;
        }
        if (url.loc._text.match(/\/products\/.+/)) {
            products += 1;
        }
        if (url.loc._text.match(/\/sales\/.+/)) {
            sales += 1;
        }
    });

    t.deepEqual(categories / 2, 6);

    const brandCount = (await requestBrands.getBrandsList()).length;
    t.deepEqual(brands / 2, brandCount);

    const home = (await helper.get(config.api.home)).body;
    t.deepEqual(
        sales / 2,
        Array.isArray(home["featured"])
            ? home["featured"].length
            : 1 +
                  home["today"].length +
                  home["current"].length +
                  home["potd"].length
    );

    let domestic = (await requestProducts.getProducts(config.api.featuredSales))
        .length;
    domestic += (await requestProducts.getProducts(config.api.currentSales))
        .length;
    domestic += (await requestProducts.getProducts(config.api.todaySales))
        .length;
    domestic += (await requestProducts.getProducts(config.api.potdSales))
        .length;

    let international = (await requestProducts.getProducts(
        config.api.featuredSales,
        "international"
    )).length;
    international += (await requestProducts.getProducts(
        config.api.currentSales,
        "international"
    )).length;
    international += (await requestProducts.getProducts(
        config.api.todaySales,
        "international"
    )).length;
    international += (await requestProducts.getProducts(
        config.api.potdSales,
        "international"
    )).length;

    t.deepEqual(products / 2, domestic + international);
});
