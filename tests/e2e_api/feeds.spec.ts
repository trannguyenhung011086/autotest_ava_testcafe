import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as model from '../../common/interface'
import Papa from 'papaparse'
let facebookFeeds: model.FacebookFeeds[]
let googleFeeds: model.GoogleFeeds[]
let googleDynamicFeeds: model.GoogleDynamicFeeds[]
let criteoFeeds: model.CriteoFeeds[]
let googleMerchantFeeds: model.GoogleMerchantFeeds
let insiderFeeds: model.InsiderFeeds
import convert from 'xml-js'

describe('Product feeds API', () => {
    beforeAll(async () => {
        jest.setTimeout(150000)
    })

    test('GET / get Facebook product feeds ' + config.baseUrl + config.api.feedFacebook, async () => {
        let response = await request.get(config.api.feedFacebook)
        expect(response.status).toEqual(200)

        let parsed = Papa.parse(response.data, { header: true })

        facebookFeeds = parsed.data
        for (let feed of facebookFeeds) {
            try {
                let feedId = feed.id.replace('_', ';').split(';')[0]
                expect(feed.link).toInclude(feedId)

                let variation = feed.id.replace('_', ';').split(';')[1]
                if (feed.link.indexOf('?color') != -1) {
                    expect(feed.link).toInclude(`?color=${variation}`)
                }

                expect(feed.title).not.toBeEmpty()
                expect(feed.description).not.toBeEmpty()
                expect(feed.brand).not.toBeEmpty()
                expect(feed.image_link.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)

                let price = parseInt(feed.price.split(' ')[0])
                let sale_price = parseInt(feed.sale_price.split(' ')[0])
                expect(price).toBeGreaterThanOrEqual(sale_price)

                let start = feed.sale_price_effective_date.split('/')[0]
                let end = feed.sale_price_effective_date.split('/')[1]
                expect(new Date(start)).toBeBefore(new Date(end))

                expect(feed.availability).toMatch(/^(in stock|out of stock)$/)
                expect(feed.condition).toEqual('new')
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        }

        expect(parsed.errors).toBeArrayOfSize(0)
        expect(parsed.meta.fields).toEqual(['id',
            'title',
            'link',
            'image_link',
            'price',
            'sale_price',
            'sale_price_effective_date',
            'description',
            'availability',
            'brand',
            'condition'])
    })

    test('GET / get Google product feeds ' + config.baseUrl + config.api.feedGoogle, async () => {
        let response = await request.get(config.api.feedGoogle)
        expect(response.status).toEqual(200)

        let parsed = Papa.parse(response.data, { header: true })

        googleFeeds = parsed.data
        for (let feed of googleFeeds) {
            try {
                expect(feed["Custom label"]).not.toBeEmpty()
                expect(feed["Page URL"]).toInclude('https://www.leflair.vn/vn/products/')
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        }

        expect(parsed.errors).toBeArrayOfSize(0)
        expect(parsed.meta.fields).toEqual(['Page URL', 'Custom label'])
    })

    test('GET / get Google dynamic product feeds ' + config.baseUrl + config.api.feedGoogleDynamic, async () => {
        let response = await request.get(config.api.feedGoogleDynamic)
        expect(response.status).toEqual(200)

        let parsed = Papa.parse(response.data, { header: true })

        googleDynamicFeeds = parsed.data
        for (let feed of googleDynamicFeeds) {
            try {
                let feedId = feed.ID.replace('_', ';').split(';')[0]
                expect(feed["Final URL"]).toInclude(feedId)
                expect(feed["Final mobile URL"]).toInclude(feedId)

                let variation = feed.ID.replace('_', ';').split(';')[1]
                if (feed["Final URL"].indexOf('?color') != -1) {
                    expect(feed["Final URL"]).toInclude(`?color=${variation}`)
                    expect(feed["Final mobile URL"]).toInclude(`?color=${variation}`)
                }

                expect(feed["Image URL"].toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)
                expect(feed["Item category"]).not.toBeEmpty()
                expect(feed["Item description"]).not.toBeEmpty()
                expect(feed["Item title"]).not.toBeEmpty()

                let price = parseInt(feed.Price.split(' ')[0])
                let sale_price = parseInt(feed["Sale price"].split(' ')[0])
                expect(price).toBeGreaterThanOrEqual(sale_price)
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        }

        expect(parsed.errors).toBeArrayOfSize(0)
        expect(parsed.meta.fields).toEqual(['ID',
            'Item title',
            'Final URL',
            'Image URL',
            'Item description',
            'Item category',
            'Price',
            'Sale price',
            'Final mobile URL'])
    })

    test('GET / get Criteo product feeds ' + config.baseUrl + config.api.feedCriteo, async () => {
        let response = await request.get(config.api.feedCriteo)
        expect(response.status).toEqual(200)

        let parsed = Papa.parse(response.data, { header: true })

        criteoFeeds = parsed.data
        for (let feed of criteoFeeds) {
            try {
                let feedId = feed.id.replace('_', ';').split(';')[0]
                expect(feed.producturl).toInclude(feedId)

                expect(feed.bigimage.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)
                expect(feed.category).not.toBeEmpty()
                expect(feed.description).not.toBeEmpty()
                expect(feed.instock).toMatch(/^true|false$/)
                expect(feed.name).not.toBeEmpty()
                expect(parseInt(feed.price)).toBeLessThanOrEqual(parseInt(feed.retailprice))
                expect(feed.extra_brand).not.toBeEmpty()
                expect(feed.extra_size).toBeEmpty()

                let variation = feed.id.replace('_', ';').split(';')[1]
                if (!!feed.extra_color) {
                    expect(feed.producturl).toInclude(`?color=${variation}`)
                    expect(encodeURI(feed.extra_color)).toEqual(variation)
                }
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        }

        expect(parsed.errors).toBeArrayOfSize(0)
        expect(parsed.meta.fields).toEqual(['id',
            'name',
            'producturl',
            'bigimage',
            'price',
            'retailprice',
            'description',
            'instock',
            'extra_brand',
            'extra_color',
            'extra_size',
            'category'])
    })

    test('GET / get Google Merchant product feeds', async () => {
        let response = await request.get(config.api.feedGoogleMerchant)
        expect(response.status).toEqual(200)

        let result: any = convert.xml2js(response.data, { compact: true })
        googleMerchantFeeds = result

        expect(googleMerchantFeeds._declaration._attributes.version).toEqual('1.0')
        expect(googleMerchantFeeds._declaration._attributes.encoding).toEqual('UTF-8')
        expect(googleMerchantFeeds.feed._attributes.xmlns).toEqual('http://www.w3.org/2005/Atom')
        expect(googleMerchantFeeds.feed._attributes["xmlns:g"]).toEqual('http://base.google.com/ns/1.0')

        for (let entry of googleMerchantFeeds.feed.entry) {
            try {
                let feedId = entry["g:id"]._text.replace('_', ';').split(';')[0]
                expect(entry["g:link"]._text).toInclude(feedId)

                expect(entry["g:title"]._text).not.toBeEmpty()
                expect(entry["g:description"]._text).not.toBeEmpty()
                expect(entry["g:image_link"]._text.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)

                let variation = entry["g:id"]._text.replace('_', ';').split(';')[1]
                if (entry["g:link"]._text.indexOf('?color') != -1) {
                    expect(entry["g:link"]._text).toInclude(`?color=${variation}`)
                    expect(entry["g:color"]._text.normalize()).toInclude(decodeURI(variation))
                }

                expect(entry["g:availability"]._text).toMatch(/^(in stock|out of stock)$/)
                expect(parseInt(entry["g:price"]._text)).toBeGreaterThanOrEqual(parseInt(entry["g:sale_price"]._text))
                expect(entry["g:brand"]._text).not.toBeEmpty()
                expect(entry["g:condition"]._text).toEqual('new')
                expect(entry["g:google_product_category"]._text).not.toBeEmpty()
                expect(entry["g:product_type"]._text).not.toBeEmpty()
                expect(entry["g:mpn"]._text).not.toBeEmpty()
                expect(entry["g:adult"]._text).toMatch(/true|false/)
                expect(parseInt(entry["g:multipack"]._text)).toBeGreaterThan(0)
                expect(entry["g:is_bundle"]._text).toMatch(/true|false/)

                expect(entry).toContainKeys(['g:gtin',
                    'g:age_group',
                    'g:gender',
                    'g:material',
                    'g:pattern',
                    'g:size',
                    'g:item_group_id',
                    'g:shipping'])

                expect(entry["g:tax"]._text).not.toBeEmpty()
            } catch (error) {
                throw { failed_feed: entry, error: error }
            }
        }
    })

    test('GET / get Insider product feeds', async () => {
        let response = await request.get(config.api.feedInsider)
        expect(response.status).toEqual(200)

        let result: any = convert.xml2js(response.data, { compact: true })
        insiderFeeds = result

        expect(insiderFeeds._declaration._attributes.version).toEqual('1.0')
        expect(insiderFeeds._declaration._attributes.encoding).toEqual('UTF-8')
        expect(insiderFeeds.products._attributes.xmlns).toEqual('http://www.w3.org/2005/Atom')

        for (let product of insiderFeeds.products.product) {
            try {
                let feedId = product.id._text.replace('_', ';').split(';')[0]
                expect(product.link._text).toInclude(feedId)

                let variation = product.id._text.replace('_', ';').split(';')[1]
                if (product.link._text.indexOf('?color') != -1) {
                    expect(product.link._text).toInclude(variation)
                }

                expect(product.title._text).not.toBeEmpty()
                expect(product.image_url._text.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)
                expect(product.description._text).not.toBeEmpty()
                expect(product.category._text).not.toBeEmpty()
                expect(parseInt(product.sale_price._text)).toBeLessThanOrEqual(parseInt(product.price._text))
                expect(product.instock._text).toMatch(/true|false/)
                expect(product.extra_brand._text).not.toBeEmpty()
            } catch (error) {
                throw { failed_feed: product, error: error }
            }
        }
    })
})