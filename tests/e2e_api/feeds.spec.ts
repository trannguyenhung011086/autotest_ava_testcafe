import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as model from '../../common/interface'
import Papa from 'papaparse'
let eventsCache: model.EventCache[]
let itemsCache: model.ItemCache
let facebookFeeds: model.FacebookFeeds[]
let googleFeeds: model.GoogleFeeds[]
let googleDynamicFeeds: model.GoogleDynamicFeeds[]
let criteoFeeds: model.CriteoFeeds[]
let googleMerchantFeeds: model.GoogleMerchantFeeds
let insiderFeeds: model.InsiderFeeds
import convert from 'xml-js'

describe('Create caching data API', async () => {
    beforeAll(async () => {
        jest.setTimeout(150000)
    })

    test('GET / create events caching ' + config.baseUrl, async () => {
        let response = await request.get(config.api.subscriberNs + '/events/caching',
            null, config.apiNs)
        expect(response.status).toEqual(200)

        eventsCache = response.data
        for (let cache of eventsCache) {
            try {
                expect(cache.id).not.toBeEmpty()
                expect(cache.title).not.toBeEmpty()
                expect(cache.description).not.toBeEmpty()
                expect(cache.brand.id).not.toBeEmpty()
                expect(cache.brand.name).not.toBeEmpty()
                expect(cache.brand.logo).not.toBeEmpty()
                expect(cache.type.id).not.toBeEmpty()
                expect(cache.type.name).not.toBeEmpty()

                expect(cache.event.id).not.toBeEmpty()
                expect(new Date(cache.event.startDate)).toBeBefore(new Date(cache.event.endDate))
                expect(cache.event.featured).toBeBoolean()
                expect(cache.event.categories).toBeArray()
                expect(cache.event).toContainKey('campaignId')
                expect(cache.event.potd).toBeBoolean()
                expect(cache.event).toContainKey('potdId')
                // if (cache.event.potd) {
                //     expect(cache.event.potdId).not.toBeEmpty()
                // } else {
                //     expect(cache.event.potdId).toBeNull()
                // }

                if (cache.category) {
                    expect(cache.category.id).not.toBeEmpty()
                    expect(cache.category.name).not.toBeEmpty()
                }

                for (let variation of cache.variations) {
                    expect(variation.id).not.toBeEmpty()
                    expect(variation.nsId).not.toBeEmpty()
                    expect(variation.image.toLowerCase()).toMatch(/.+\.jpg|\.jpeg|\.png/)
                    expect(variation.image2.toLowerCase()).toMatch(/.+\.jpg|\.jpeg|\.png/)

                    if (variation.color) {
                        expect(variation.color).not.toBeEmpty()
                    }
                    if (variation.barcode) {
                        expect(variation.barcode).not.toBeEmpty()
                    }
                }
            } catch (error) {
                throw { failed_cache: JSON.stringify(cache, null, '\t'), error: error }
            }
        }
    })

    test('GET / create items caching ' + config.baseUrl, async () => {
        let response = await request.get(config.api.subscriberNs + '/items/caching',
            null, config.apiNs)
        expect(response.status).toEqual(200)

        itemsCache = response.data
        for (let item of itemsCache.list) {
            try {
                expect(item.nsId).not.toBeEmpty()
                expect(item.quantity).toBeGreaterThanOrEqual(0)
                expect(item.retailPrice).toBeGreaterThanOrEqual(item.salePrice)
            } catch (error) {
                throw { failed_cache: item, error: error }
            }
        }
        expect(itemsCache.total).toEqual(itemsCache.list.length)
    })

    test('GET / create product feeds ' + config.baseUrl, async () => {
        let response = await request.get(config.api.subscriberNs + '/product-feeds/caching',
            null, config.apiNs)
        expect(response.status).toEqual(200)
        expect(response.data).toEqual('Product Feed is ready')
    })
})

describe('Product feeds API', () => {
    beforeAll(async () => {
        jest.setTimeout(150000)
        let response = await request.get(config.api.subscriberNs + '/events/caching',
            null, config.apiNs)
        expect(response.status).toEqual(200)

        response = await request.get(config.api.subscriberNs + '/items/caching',
            null, config.apiNs)
        expect(response.status).toEqual(200)

        response = await request.get(config.api.subscriberNs + '/product-feeds/caching',
            null, config.apiNs)
        expect(response.status).toEqual(200)
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
                expect(feed.link).not.toEndWith('?')

                let variation = feed.id.replace('_', ';').split(';')[1]
                if (feed.link.match(/(\?|&)color/)) {
                    expect(feed.link).toInclude(variation)
                }

                expect(feed.title).not.toBeEmpty()
                expect(feed.description).not.toBeEmpty()
                expect(feed.brand).not.toBeEmpty()
                expect(feed.image_link.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)

                let retail_price = parseInt(feed.price.split(' ')[0])
                let sale_price = parseInt(feed.sale_price.split(' ')[0])
                expect(retail_price).toBeGreaterThanOrEqual(sale_price)

                let start = feed.sale_price_effective_date.split('/')[0]
                let end = feed.sale_price_effective_date.split('/')[1]
                expect(new Date(start)).toBeBefore(new Date(end))

                expect(feed.availability).toEqual('in stock')
                expect(feed.condition).toEqual('new')

                expect(feed.google_product_category).not.toBeEmpty()
                if (feed.google_product_category.indexOf('>') != -1) {
                    expect(feed.google_product_category.split('>').length).toBeGreaterThan(1)
                }
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
            'condition',
            'google_product_category'])
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
                expect(feed["Page URL"]).not.toEndWith('?')
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
                expect(feed["Final URL"]).not.toEndWith('?')
                expect(feed["Final mobile URL"]).not.toEndWith('?')

                let variation = feed.ID.replace('_', ';').split(';')[1]
                if (feed["Final URL"].match(/(\?|&)color/)) {
                    expect(feed["Final URL"]).toInclude(variation)
                    expect(feed["Final mobile URL"]).toInclude(variation)
                }

                expect(feed["Image URL"].toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)
                expect(feed["Item category"]).not.toBeEmpty()
                expect(feed["Item description"]).not.toBeEmpty()
                expect(feed["Item title"]).not.toBeEmpty()

                let retail_price = parseInt(feed.Price.split(' ')[0])
                let sale_price = parseInt(feed["Sale price"].split(' ')[0])
                expect(retail_price).toBeGreaterThanOrEqual(sale_price)
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
                expect(feed.producturl).not.toEndWith('?')

                expect(feed.bigimage.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)
                expect(feed.category).not.toBeEmpty()
                expect(feed.description).not.toBeEmpty()
                expect(feed.instock).toEqual('true')
                expect(feed.name).not.toBeEmpty()
                expect(feed.extra_brand).not.toBeEmpty()

                let retail_price = parseInt(feed.retailprice)
                let sale_price = parseInt(feed.price)
                expect(retail_price).toBeGreaterThanOrEqual(sale_price)

                let variation = feed.id.replace('_', ';').split(';')[1]
                if (feed.producturl.match(/(\?|&)color/)) {
                    expect(feed.producturl).toInclude(variation)
                    expect(encodeURI(feed.extra_color)).toEqual(variation)
                }
                if (feed.producturl.match(/(\?|&)size/)) {
                    expect(feed.producturl).toInclude(feed.extra_size)
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

    test('GET / get Google Merchant product feeds ' + config.baseUrl + config.api.feedGoogleMerchant, async () => {
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
                expect(entry["g:link"]._text).not.toEndWith('?')

                expect(entry["g:title"]._text).not.toBeEmpty()
                expect(entry["g:description"]._text).not.toBeEmpty()
                expect(entry["g:brand"]._text).not.toBeEmpty()
                expect(entry["g:product_type"]._text).not.toBeEmpty()
                expect(entry["g:image_link"]._text.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)

                let variation = entry["g:id"]._text.replace('_', ';').split(';')[1]
                if (entry["g:link"]._text.match(/(\?|&)color/)) {
                    expect(entry["g:link"]._text).toInclude(variation)
                    expect(entry["g:color"]._text.normalize()).toInclude(decodeURI(variation))
                }
                if (entry["g:link"]._text.match(/(\?|&)size/)) {
                    expect(entry["g:link"]._text).toInclude(entry["g:size"]._text.normalize())
                }

                let retail_price = parseInt(entry["g:price"]._text)
                let sale_price = parseInt(entry["g:sale_price"]._text)
                expect(retail_price).toBeGreaterThanOrEqual(sale_price)

                expect(entry["g:availability"]._text).toEqual('in stock')
                expect(entry["g:condition"]._text).toEqual('new')
                expect(entry["g:mpn"]._text).not.toBeEmpty()
                expect(entry["g:adult"]._text).toMatch(/true|false/)
                expect(parseInt(entry["g:multipack"]._text)).toBeGreaterThan(0)
                expect(entry["g:is_bundle"]._text).toMatch(/true|false/)
                expect(entry["g:tax"]._text).not.toBeEmpty()

                expect(entry["g:google_product_category"]._text).not.toBeEmpty()
                if (entry["g:google_product_category"]._text.indexOf('>') != -1) {
                    expect(entry["g:google_product_category"]._text.split('>').length).toBeGreaterThan(1)
                }

                expect(entry).toContainKeys(['g:gtin',
                    'g:age_group',
                    'g:gender',
                    'g:material',
                    'g:pattern',
                    'g:color',
                    'g:size',
                    'g:item_group_id',
                    'g:shipping'])
            } catch (error) {
                throw { failed_feed: entry, error: error }
            }
        }
    })

    test('GET / get Insider product feeds ' + config.baseUrl + config.api.feedInsider, async () => {
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
                expect(product.link._text).not.toEndWith('?')

                let variation = product.id._text.replace('_', ';').split(';')[1]
                if (product.link._text.match(/(\?|&)color/)) {
                    expect(product.link._text).toInclude(variation)
                }

                expect(product.title._text).not.toBeEmpty()
                expect(product.image_url._text.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)
                expect(product.description._text).not.toBeEmpty()
                expect(product.category._text).not.toBeEmpty()
                expect(product.instock._text).toEqual('true')
                expect(product.extra_brand._text).not.toBeEmpty()

                let retail_price = parseInt(product.price._text)
                let sale_price = parseInt(product.sale_price._text)
                expect(retail_price).toBeGreaterThanOrEqual(sale_price)
            } catch (error) {
                throw { failed_feed: product, error: error }
            }
        }
    })

    test('Verify total feeds sent to each service', async () => {
        let response = await request.get(config.api.feedFacebook)
        let parsed = Papa.parse(response.data, { header: true })
        facebookFeeds = parsed.data

        response = await request.get(config.api.feedGoogle)
        parsed = Papa.parse(response.data, { header: true })
        googleFeeds = parsed.data

        response = await request.get(config.api.feedGoogleDynamic)
        parsed = Papa.parse(response.data, { header: true })
        googleDynamicFeeds = parsed.data

        response = await request.get(config.api.feedCriteo)
        parsed = Papa.parse(response.data, { header: true })
        criteoFeeds = parsed.data

        response = await request.get(config.api.feedGoogleMerchant)
        let result: any = convert.xml2js(response.data, { compact: true })
        googleMerchantFeeds = result

        response = await request.get(config.api.feedInsider)
        result = convert.xml2js(response.data, { compact: true })
        insiderFeeds = result

        expect(facebookFeeds.length).toEqual(googleFeeds.length)
        expect(googleFeeds.length).toEqual(googleDynamicFeeds.length)
        expect(googleDynamicFeeds.length).toEqual(criteoFeeds.length)
        expect(criteoFeeds.length).toEqual(googleMerchantFeeds.feed.entry.length)
        expect(googleMerchantFeeds.feed.entry.length).toEqual(insiderFeeds.products.product.length)
    })
})