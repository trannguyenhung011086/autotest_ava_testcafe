import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";
import * as Model from "../../../../common/interface";
import * as convert from "xml-js";

let sitemap: Model.Sitemap;

const helper = new Utils.Helper();
const requestBrands = new Utils.BrandUtils();
const requestProducts = new Utils.ProductUtils();
const requestSales = new Utils.SaleUtils();

import test from "ava";

// wait for WWW-672
test.skip("Get 200 success code when accessing sitemap", async t => {
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

    let sales = await requestSales.getSales(config.api.currentSales);
    sales = sales.concat(
        await requestSales.getSales(config.api.todaySales),
        await requestSales.getSales(config.api.potdSales),
        await requestSales.getSales(config.api.internationalSales),
        await requestSales.getSales(config.api.featuredSales)
    );

    const brands = await requestBrands.getBrandsList();

    let products = await requestProducts.getProducts(config.api.currentSales);
    products = products.concat(
        await requestProducts.getProducts(config.api.todaySales),
        await requestProducts.getProducts(config.api.potdSales),
        await requestProducts.getProducts(config.api.internationalSales),
        await requestProducts.getProducts(config.api.featuredSales)
    );

    const menu: Model.TopMenu = (await helper.get(config.api.cateMenu)).body;
    const categories = menu.items;

    let sitemapCategories: string[] = [];
    let sitemapSales: string[] = [];
    let sitemapBrands: string[] = [];
    let sitemapProducts: string[] = [];

    for (const url of sitemap.urlset.url) {
        t.regex(url.loc._text, /https:\/\/www.leflair.vn/);
        t.regex(url.lastmod._text, /^\d{4}-\d{2}-\d{2}$/);
        t.deepEqual(url.changefreq._text, "daily");
        t.deepEqual(url.priority._text, "0.8");

        if (url.loc._text.match(/\/categories\/.+/)) {
            sitemapCategories.push(url.loc._text);
        }
        if (url.loc._text.match(/\/brands\/.+/)) {
            sitemapBrands.push(url.loc._text);
        }
        if (url.loc._text.match(/\/products\/.+/)) {
            sitemapProducts.push(url.loc._text);
        }
        if (url.loc._text.match(/\/sales\/.+/)) {
            sitemapSales.push(url.loc._text);
        }
    }

    t.true(
        sitemapCategories.every(url =>
            categories.some(category => url.includes(category.id))
        )
    );
    t.true(
        sitemapBrands.every(url => brands.some(brand => url.includes(brand.id)))
    );
    t.true(
        sitemapSales.every(url => sales.some(sale => url.includes(sale.id)))
    );
    t.true(
        sitemapProducts.every(url =>
            products.some(product => url.includes(product.id))
        )
    );
});
