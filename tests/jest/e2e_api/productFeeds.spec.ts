import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as model from '../../../common/interface'
import Papa from 'papaparse'
let eventsCache: model.EventCache[]
let itemsCache: model.ItemCache
let facebookFeeds: model.FacebookFeeds[]
let googleFeeds: model.GoogleFeeds[]
let googleDynamicFeeds: model.GoogleDynamicFeeds[]
let criteoFeeds: model.CriteoFeeds[]
let criteoFeeds2: model.CriteoFeeds2[]
let googleMerchantFeeds: model.GoogleMerchantFeeds
let insiderFeeds: model.InsiderFeeds
let secretSales = []
let secretSaleProducts = []
let googleCategories: string[]
import convert from 'xml-js'

export const CacheCreateTest = () => {
    beforeAll(async () => {
        jest.setTimeout(150000)
    })

    it('GET / create events caching ' + config.baseUrl, async () => {
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

                if (cache.category) {
                    expect(cache.category.id).not.toBeEmpty()
                    expect(cache.category.name).not.toBeEmpty()
                    expect(cache.category.nsId).not.toBeEmpty()
                }

                for (let variation of cache.variations) {
                    expect(variation.id).not.toBeEmpty()
                    expect(variation.nsId).not.toBeEmpty()
                    expect(variation.barcode).not.toBeEmpty()
                    expect(variation.image.toLowerCase()).toMatch(/.+\.jpg|\.jpeg|\.png/)
                    expect(variation.image2.toLowerCase()).toMatch(/.+\.jpg|\.jpeg|\.png/)

                    if (variation.color) {
                        expect(variation.color).not.toBeEmpty()
                    }
                }
            } catch (error) {
                throw { failed_cache: JSON.stringify(cache, null, '\t'), error: error }
            }
        }
    })

    it('GET / create items caching ' + config.baseUrl, async () => {
        let response = await request.get(config.api.subscriberNs + '/items/caching',
            null, config.apiNs)
        expect(response.status).toEqual(200)

        itemsCache = response.data
        expect(itemsCache.total).toEqual(itemsCache.list.length)

        for (let item of itemsCache.list) {
            try {
                expect(item.nsId).not.toBeEmpty()
                expect(item.quantity).toBeNumber()
                expect(item.retailPrice).toBeGreaterThanOrEqual(item.salePrice)
            } catch (error) {
                throw { failed_cache: item, error: error }
            }
        }
    })

    it('GET / create product feeds ' + config.baseUrl, async () => {
        let response = await request.get(config.api.subscriberNs + '/product-feeds/caching',
            null, config.apiNs)
        expect(response.status).toEqual(200)
        expect(response.data).toEqual('Product Feed is ready')
    })
}

export const ProductFeedsTest = () => {
    beforeAll(async () => {
        jest.setTimeout(150000)
        let response = await request.get(config.api.subscriberNs + '/events/caching',
            null, config.apiNs)
        expect(response.status).toEqual(200)
        eventsCache = response.data
        for (let cache of eventsCache) {
            if (cache.event.campaignId) {
                secretSales.push(cache)
            }
        }
        for (let sale of secretSales) {
            for (let item of sale.variations) {
                secretSaleProducts.push(item)
            }
        }

        response = await request.get(config.api.subscriberNs + '/items/caching',
            null, config.apiNs)
        expect(response.status).toEqual(200)
        itemsCache = response.data

        response = await request.get(config.api.subscriberNs + '/product-feeds/caching',
            null, config.apiNs)
        expect(response.status).toEqual(200)

        let res = await request.get('https://www.google.com/basepages/producttype/taxonomy.en-US.txt')
        googleCategories = res.data.split('\n')
    })

    it('GET / get Facebook product feeds ' + config.baseUrl + config.api.feedFacebook, async () => {
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

                // category must comply with https://www.google.com/basepages/producttype/taxonomy.en-US.txt
                expect(googleCategories).toContain(feed.google_product_category)

                for (let item of secretSaleProducts) {
                    expect(feedId).not.toEqual(item.id)
                }
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        }

        expect(parsed.errors).toBeArrayOfSize(0)
    })

    it('GET / get Google product feeds ' + config.baseUrl + config.api.feedGoogle, async () => {
        let response = await request.get(config.api.feedGoogle)
        expect(response.status).toEqual(200)

        let parsed = Papa.parse(response.data, { header: true })
        googleFeeds = parsed.data

        for (let feed of googleFeeds) {
            try {
                expect(feed["Custom label"]).not.toBeEmpty()
                expect(feed["Page URL"]).toInclude('https://www.leflair.vn/vn/products/')
                expect(feed["Page URL"]).not.toEndWith('?')

                for (let item of secretSaleProducts) {
                    expect(feed["Page URL"]).not.toInclude(item.id)
                }
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        }

        expect(parsed.errors).toBeArrayOfSize(0)
    })

    it('GET / get Google dynamic product feeds ' + config.baseUrl + config.api.feedGoogleDynamic, async () => {
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

                for (let item of secretSaleProducts) {
                    expect(feedId).not.toEqual(item.id)
                }
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        }

        expect(parsed.errors).toBeArrayOfSize(0)
    })

    it('GET / get Criteo product feeds v1 ' + config.baseUrl + config.api.feedCriteo, async () => {
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

                for (let item of secretSaleProducts) {
                    expect(feedId).not.toEqual(item.id)
                }
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        }

        expect(parsed.errors).toBeArrayOfSize(0)
    })

    // need to improve Criteo feeds format later
    it.skip('GET / get Criteo product feeds v2 ' + config.baseUrl + config.api.feedCriteo, async () => {
        let response = await request.get(config.api.feedCriteo)
        expect(response.status).toEqual(200)

        let parsed = Papa.parse(response.data, { header: true })
        criteoFeeds2 = parsed.data

        for (let feed of criteoFeeds2) {
            try {
                expect(feed.id.length).toBeLessThan(240)
                expect(feed.title).not.toBeEmpty()
                expect(feed.description).not.toBeEmpty()

                // category must comply with https://www.google.com/basepages/producttype/taxonomy.en-US.txt
                expect(googleCategories).toContain(feed.google_product_category)

                let feedId = feed.id.replace('_', ';').split(';')[0]
                expect(feed.link).toInclude(feedId)
                expect(feed.link).not.toEndWith('?')

                let variation = feed.id.replace('_', ';').split(';')[1]
                if (feed.link.match(/(\?|&)color/)) {
                    expect(feed.link).toInclude(variation)
                    expect(encodeURI(feed.color)).toEqual(variation)
                }
                if (feed.link.match(/(\?|&)size/)) {
                    expect(feed.link).toInclude(feed.size)
                }

                expect(feed.image_link.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)

                expect(feed.availability).toEqual('in stock')

                let retail_price = parseInt(feed.price)
                let sale_price = parseInt(feed.sale_price)
                expect(retail_price).toBeGreaterThanOrEqual(sale_price)

                expect(feed.brand).not.toBeEmpty()

                expect(feed.product_type).not.toBeEmpty()

                expect(feed.adult).toMatch(/yes|no/)

                expect(feed.condition).toEqual('new')

                expect(feed.age_group).toMatch(/newborn|infant|toddler|kids|adult/)

                for (let item of secretSaleProducts) {
                    expect(feedId).not.toEqual(item.id)
                }
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        }

        expect(parsed.errors).toBeArrayOfSize(0)
    })

    it('GET / get Google Merchant product feeds ' + config.baseUrl + config.api.feedGoogleMerchant, async () => {
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
                expect(entry["g:id"]._text.length).toBeLessThanOrEqual(50)

                expect(entry["g:title"]._text).not.toBeEmpty()
                expect(entry["g:title"]._text.length).toBeLessThanOrEqual(150)

                expect(entry["g:description"]._text).not.toBeEmpty()

                let feedId = entry["g:id"]._text.replace('_', ';').split(';')[0]
                expect(entry["g:link"]._text).toInclude(feedId)
                expect(entry["g:link"]._text).not.toEndWith('?')

                let variation = entry["g:id"]._text.replace('_', ';').split(';')[1]
                if (entry["g:link"]._text.match(/(\?|&)color/)) {
                    expect(entry["g:link"]._text).toInclude(variation)
                    expect(entry["g:color"]._text.normalize()).toInclude(decodeURI(variation))
                }
                if (entry["g:link"]._text.match(/(\?|&)size/)) {
                    expect(entry["g:link"]._text).toInclude(entry["g:size"]._text.normalize())
                }

                expect(entry["g:image_link"]._text.toLowerCase()).toMatch(/leflair-assets.storage.googleapis.com\/.+\.jpg|\.jpeg|\.png/)

                expect(entry["g:availability"]._text).toEqual('in stock')

                let retail_price = parseInt(entry["g:price"]._text)
                let sale_price = parseInt(entry["g:sale_price"]._text)
                expect(retail_price).toBeGreaterThanOrEqual(sale_price)

                // category must comply with https://www.google.com/basepages/producttype/taxonomy.en-US.txt

                expect(entry["g:google_product_category"]._text).not.toInclude(' & ')
                expect(entry["g:google_product_category"]._text).not.toInclude(' > ')

                if (entry["g:google_product_category"]._text.indexOf('&gt;') != -1) {
                    entry["g:google_product_category"]._text.replace('&gt;', '>')
                }
                if (entry["g:google_product_category"]._text.indexOf('&amp;') != -1) {
                    entry["g:google_product_category"]._text.replace('&amp;', '&')
                }

                expect(googleCategories).toContain(entry["g:google_product_category"]._text)

                expect(entry["g:product_type"]._text).not.toBeEmpty()

                expect(entry["g:brand"]._text).not.toBeEmpty()

                expect(entry["g:mpn"]._text).not.toBeEmpty()

                expect(entry["g:condition"]._text).toEqual('new')

                expect(entry["g:adult"]._text).toMatch(/yes|no/)

                expect(parseInt(entry["g:multipack"]._text)).toBeGreaterThan(1)

                expect(entry["g:is_bundle"]._text).toMatch(/yes|no/)

                if (entry["g:age_group"]._text.length > 0) {
                    expect(entry["g:age_group"]._text).toMatch(/newborn|infant|toddler|kids|adult/)
                }

                expect(entry["g:color"]._text).not.toBeEmpty()

                expect(entry["g:gender"]._text).toMatch(/male|female|unisex/)

                expect(entry).toContainKeys(['g:gtin',
                    'g:material',
                    'g:pattern',
                    'g:size',
                    'g:item_group_id',
                    'g:shipping',
                    'g:tax'])

                for (let item of secretSaleProducts) {
                    expect(feedId).not.toEqual(item.id)
                }
            } catch (error) {
                throw { failed_feed: entry, error: error }
            }
        }
    })

    it('GET / get Insider product feeds ' + config.baseUrl + config.api.feedInsider, async () => {
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

                for (let item of secretSaleProducts) {
                    expect(feedId).not.toEqual(item.id)
                }
            } catch (error) {
                throw { failed_feed: product, error: error }
            }
        }
    })

    it('Verify total feeds sent to each service ' + config.baseUrl, async () => {
        let totalFeeds = facebookFeeds.length
        expect(totalFeeds).toEqual(googleFeeds.length)
        expect(totalFeeds).toEqual(googleDynamicFeeds.length)
        expect(totalFeeds).toEqual(criteoFeeds.length)
        expect(totalFeeds).toEqual(googleMerchantFeeds.feed.entry.length)
        expect(totalFeeds).toEqual(insiderFeeds.products.product.length)
    })

    // it('Verify lowest price for submitted variation ' + config.baseUrl, async () => {

    // })
}

describe('Create caching data API', CacheCreateTest)
describe('Product feeds API', ProductFeedsTest)