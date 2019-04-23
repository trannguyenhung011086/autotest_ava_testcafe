import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";
import * as convert from "xml-js";

let sitemapIndex: Model.SitemapIndex;
let sitemap: Model.Sitemap;

const helper = new Utils.Helper();
const requestBrands = new Utils.BrandUtils();
const requestMenus = new Utils.MenusUtils();
const requestMenuProducts = new Utils.MenusUtils();

import test from "ava";

// wait for WWW-672
test.before(async t => {
    const res = await helper.getPlain(config.api.sitemapIndex);
    t.deepEqual(res.statusCode, 200);

    const result: any = convert.xml2js(res.body, { compact: true });
    sitemapIndex = result;
});

test("Check sitemap index", async t => {
    t.true(sitemapIndex.hasOwnProperty("sitemapindex"));

    t.deepEqual(sitemapIndex._declaration._attributes.encoding, "UTF-8");
    t.deepEqual(sitemapIndex._declaration._attributes.version, "1.0");
    t.deepEqual(
        sitemapIndex.sitemapindex._attributes.xmlns,
        "http://www.sitemaps.org/schemas/sitemap/0.9"
    );
    t.deepEqual(
        sitemapIndex.sitemapindex._attributes["xmlns:image"],
        "http://www.google.com/schemas/sitemap-image/1.1"
    );
    t.deepEqual(
        sitemapIndex.sitemapindex._attributes["xmlns:mobile"],
        "http://www.google.com/schemas/sitemap-mobile/1.0"
    );
    t.deepEqual(
        sitemapIndex.sitemapindex._attributes["xmlns:video"],
        "http://www.google.com/schemas/sitemap-video/1.1"
    );

    t.true(sitemapIndex.sitemapindex.sitemap.length > 0);

    sitemapIndex.sitemapindex.sitemap.forEach(url => {
        t.regex(url.loc._text, /https:\/\/www.leflair.vn\//);
    });
});

test("Check sitemap brands", async t => {
    const res = await helper.getPlain(config.api.sitemapBrands);
    const result: any = convert.xml2js(res.body, { compact: true });
    const sitemapBrands: Model.Sitemap = result;

    await helper.validateSitemap(t, sitemapBrands);

    const brandList = await requestBrands.getBrandsList();

    t.deepEqual(brandList.length, sitemapBrands.urlset.url.length / 2 - 1);

    brandList.forEach(brand => {
        const check = sitemapBrands.urlset.url.some(url => {
            return (
                brand.slug ===
                url.loc._text.replace(
                    /https:\/\/www.leflair.vn\/(vn|en)\/brands\//,
                    ""
                )
            );
        });
        if (!check) {
            console.log(check, brand.slug);
        }
        t.true(check);
    });
});

test("Check sitemap categories", async t => {
    const res = await helper.getPlain(config.api.sitemapCategories);
    const result: any = convert.xml2js(res.body, { compact: true });
    const sitemapCategories: Model.Sitemap = result;

    await helper.validateSitemap(t, sitemapCategories);

    const menus = await requestMenus.getAllMenus();

    t.deepEqual(menus.length, sitemapCategories.urlset.url.length / 2);

    menus.forEach(menu => {
        const checkEN = sitemapCategories.urlset.url.some(url => {
            return (
                menu.slug.en ===
                url.loc._text.replace(/https:\/\/www.leflair.vn\/en\//, "")
            );
        });
        t.true(checkEN);

        const checkVN = sitemapCategories.urlset.url.some(url => {
            return (
                menu.slug.vn ===
                url.loc._text.replace(/https:\/\/www.leflair.vn\/vn\//, "")
            );
        });
        t.true(checkVN);
    });
});

test("Check sitemap category products", async t => {
    const menus = await requestMenus.getAllMenus();

    for (const menu of menus) {
        const products = await requestMenuProducts.getProductsByMenu(
            menu.slug.en
        );

        if (menu.id == "5c98a49e4e1e9aba4dae9912") {
            continue;
        } // skip International category for now because API is returning empty result

        const res = await helper.getPlain(
            config.api.sitemapCategory + menu.id + ".xml"
        );
        const result: any = convert.xml2js(res.body, { compact: true });
        const sitemapCategory: Model.Sitemap = result;

        t.deepEqual(products.total, sitemapCategory.urlset.url.length / 2);

        products.data.forEach(product => {
            const check = sitemapCategory.urlset.url.some(url => {
                return (
                    product.slug ===
                    url.loc._text.replace(
                        /https:\/\/www.leflair.vn\/(en|vn)\/products\//,
                        ""
                    )
                );
            });
            if (!check) {
                console.log(check, menu.slug.en, product.slug);
            }
            t.true(check);
        });
    }
});
