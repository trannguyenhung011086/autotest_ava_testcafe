import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as model from '../../../common/interface'
import Papa from 'papaparse'
import convert from 'xml-js'

let facebookFeeds: model.FacebookFeeds[]
let googleFeeds: model.GoogleFeeds[]
let googleDynamicFeeds: model.GoogleDynamicFeeds[]
let criteoFeeds: model.CriteoFeeds[]
let criteoFeeds2: model.CriteoFeeds2[]
let googleMerchantFeeds: model.GoogleMerchantFeeds
let insiderFeeds: model.InsiderFeeds
let googleCategories: string[] // mapping list: https://docs.google.com/spreadsheets/d/1cL4mK-oQCrf9K0o5o21t_ChU8yDVnppxNGJmNJ3rkgw/edit#gid=2031209736

let helper = new Utils.Helper

export const ProductFeedsTest = () => {
    beforeAll(async () => {
        let res = await helper.getPlain('https://www.google.com/basepages/producttype/taxonomy.en-US.txt')
        googleCategories = res.body.split('\n')
        jest.setTimeout(150000)
    })

    it('GET / get Facebook product feeds ' + config.baseUrl + config.api.feedFacebook, async () => {
        let res = await helper.getPlain(config.api.feedFacebook)
        expect(res.statusCode).toEqual(200)

        let parsed = Papa.parse(res.body, { header: true })
        facebookFeeds = parsed.data

        facebookFeeds.forEach(feed => {
            try {
                expect(feed.link).toInclude(feed.id)
                expect(feed.title).not.toBeEmpty()
                expect(feed.description).not.toBeEmpty()
                expect(feed.brand).not.toBeEmpty()
                expect(helper.validateImage(feed.image_link)).toBeTrue()

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
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        })

        expect(parsed.errors).toBeArrayOfSize(0)
    })

    it('GET / get Google product feeds ' + config.baseUrl + config.api.feedGoogle, async () => {
        let res = await helper.getPlain(config.api.feedGoogle)
        expect(res.statusCode).toEqual(200)

        let parsed = Papa.parse(res.body, { header: true })
        googleFeeds = parsed.data

        googleFeeds.forEach(feed => {
            try {
                expect(feed["Custom label"]).not.toBeEmpty()
                expect(feed["Page URL"]).toInclude('https://www.leflair.vn/vn/products/')
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        })

        expect(parsed.errors).toBeArrayOfSize(0)
    })

    it('GET / get Google dynamic product feeds ' + config.baseUrl + config.api.feedGoogleDynamic, async () => {
        let res = await helper.getPlain(config.api.feedGoogleDynamic)
        expect(res.statusCode).toEqual(200)

        let parsed = Papa.parse(res.body, { header: true })
        googleDynamicFeeds = parsed.data

        googleDynamicFeeds.forEach(feed => {
            try {
                expect(feed["Final URL"]).toInclude(feed.ID)
                expect(feed["Final mobile URL"]).toInclude(feed.ID)
                expect(helper.validateImage(feed["Image URL"])).toBeTrue()
                expect(feed["Item category"]).not.toBeEmpty()
                expect(feed["Item description"]).not.toBeEmpty()
                expect(feed["Item title"]).not.toBeEmpty()

                let retail_price = parseInt(feed.Price.split(' ')[0])
                let sale_price = parseInt(feed["Sale price"].split(' ')[0])
                expect(retail_price).toBeGreaterThanOrEqual(sale_price)
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        })

        expect(parsed.errors).toBeArrayOfSize(0)
    })

    it('GET / get Criteo product feeds v1 ' + config.baseUrl + config.api.feedCriteo, async () => {
        let res = await helper.getPlain(config.api.feedCriteo)
        expect(res.statusCode).toEqual(200)

        let parsed = Papa.parse(res.body, { header: true })
        criteoFeeds = parsed.data

        criteoFeeds.forEach(feed => {
            try {
                expect(feed.producturl).toInclude(feed.id)
                expect(helper.validateImage(feed.bigimage)).toBeTrue()
                expect(feed.category).not.toBeEmpty()
                expect(feed.description).not.toBeEmpty()
                expect(feed.instock).toEqual('true')
                expect(feed.name).not.toBeEmpty()
                expect(feed.extra_brand).not.toBeEmpty()

                let retail_price = parseInt(feed.retailprice)
                let sale_price = parseInt(feed.price)
                expect(retail_price).toBeGreaterThanOrEqual(sale_price)

                if (feed.producturl.match(/(\?|&)color/)) {
                    expect(feed.producturl).toInclude(feed.extra_color)
                }
                if (feed.producturl.match(/(\?|&)size/)) {
                    expect(feed.producturl).toInclude(feed.extra_size)
                }
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        })

        expect(parsed.errors).toBeArrayOfSize(0)
    })

    // need to improve Criteo feeds format later
    it.skip('GET / get Criteo product feeds v2 ' + config.baseUrl + config.api.feedCriteo, async () => {
        let res = await helper.getPlain(config.api.feedCriteo)
        expect(res.statusCode).toEqual(200)

        let parsed = Papa.parse(res.body, { header: true })
        criteoFeeds2 = parsed.data

        criteoFeeds2.forEach(feed => {
            try {
                expect(feed.id.length).toBeLessThan(240)
                expect(feed.title).not.toBeEmpty()
                expect(feed.description).not.toBeEmpty()

                // category must comply with https://www.google.com/basepages/producttype/taxonomy.en-US.txt
                expect(googleCategories).toContain(feed.google_product_category)

                expect(feed.link).toInclude(feed.id)

                if (feed.link.match(/(\?|&)color/)) {
                    expect(feed.link).toInclude(feed.color)
                }
                if (feed.link.match(/(\?|&)size/)) {
                    expect(feed.link).toInclude(feed.size)
                }

                expect(helper.validateImage(feed.image_link)).toBeTrue()

                expect(feed.availability).toEqual('in stock')

                let retail_price = parseInt(feed.price)
                let sale_price = parseInt(feed.sale_price)
                expect(retail_price).toBeGreaterThanOrEqual(sale_price)

                expect(feed.brand).not.toBeEmpty()
                expect(feed.product_type).not.toBeEmpty()
                expect(feed.adult).toMatch(/yes|no/)
                expect(feed.condition).toEqual('new')
                expect(feed.age_group).toMatch(/newborn|infant|toddler|kids|adult/)
            } catch (error) {
                throw { failed_feed: feed, error: error }
            }
        })

        expect(parsed.errors).toBeArrayOfSize(0)
    })

    it('GET / get Google Merchant product feeds ' + config.baseUrl + config.api.feedGoogleMerchant, async () => {
        let res = await helper.getPlain(config.api.feedGoogleMerchant)
        expect(res.statusCode).toEqual(200)

        let result: any = convert.xml2js(res.body, { compact: true })
        googleMerchantFeeds = result

        expect(googleMerchantFeeds._declaration._attributes.version).toEqual('1.0')
        expect(googleMerchantFeeds._declaration._attributes.encoding).toEqual('UTF-8')
        expect(googleMerchantFeeds.feed._attributes.xmlns).toEqual('http://www.w3.org/2005/Atom')
        expect(googleMerchantFeeds.feed._attributes["xmlns:g"]).toEqual('http://base.google.com/ns/1.0')

        googleMerchantFeeds.feed.entry.forEach(entry => {
            try {
                expect(entry["g:id"]._text.length).toBeLessThanOrEqual(50)
                expect(entry["g:title"]._text).not.toBeEmpty()
                expect(entry["g:title"]._text.length).toBeLessThanOrEqual(150)
                expect(entry["g:description"]._text).not.toBeEmpty()
                expect(entry["g:link"]._text).toInclude(entry["g:id"]._text)

                if (entry["g:link"]._text.match(/(\?|&)color/)) {
                    expect(entry["g:link"]._text).toInclude(entry["g:color"]._text.normalize())
                }
                if (entry["g:link"]._text.match(/(\?|&)size/)) {
                    expect(entry["g:link"]._text).toInclude(entry["g:size"]._text.normalize())
                }

                expect(helper.validateImage(entry["g:image_link"]._text)).toBeTrue()

                expect(entry["g:availability"]._text).toEqual('in stock')

                let retail_price = parseInt(entry["g:price"]._text)
                let sale_price = parseInt(entry["g:sale_price"]._text)
                expect(retail_price).toBeGreaterThanOrEqual(sale_price)

                // category must comply with https://www.google.com/basepages/producttype/taxonomy.en-US.txt
                expect(googleCategories).toContain(entry["g:google_product_category"]._text)

                expect(entry["g:product_type"]._text).not.toBeEmpty()
                expect(entry["g:brand"]._text).not.toBeEmpty()
                expect(entry["g:mpn"]._text).not.toBeEmpty()
                expect(entry["g:condition"]._text).toEqual('new')
                expect(entry["g:adult"]._text).toMatch(/yes|no/)
                expect(parseInt(entry["g:multipack"]._text)).toBeGreaterThan(1)
                expect(entry["g:is_bundle"]._text).toMatch(/yes|no/)
                expect(entry["g:color"]._text).not.toBeEmpty()
                expect(entry["g:gender"]._text).toMatch(/male|female|unisex/)

                if (entry["g:age_group"]._text.length > 0) {
                    expect(entry["g:age_group"]._text).toMatch(/newborn|infant|toddler|kids|adult/)
                }

                expect(entry).toContainKeys(['g:gtin',
                    'g:material',
                    'g:pattern',
                    'g:size',
                    'g:item_group_id',
                    'g:shipping',
                    'g:tax'])
            } catch (error) {
                throw { failed_feed: entry, error: error }
            }
        })
    })

    it('GET / get Insider product feeds ' + config.baseUrl + config.api.feedInsider, async () => {
        let res = await helper.getPlain(config.api.feedInsider)
        expect(res.statusCode).toEqual(200)

        let result: any = convert.xml2js(res.body, { compact: true })
        insiderFeeds = result

        expect(insiderFeeds._declaration._attributes.version).toEqual('1.0')
        expect(insiderFeeds._declaration._attributes.encoding).toEqual('UTF-8')
        expect(insiderFeeds.products._attributes.xmlns).toEqual('http://www.w3.org/2005/Atom')

        insiderFeeds.products.product.forEach(product => {
            try {
                expect(product.link._text).toInclude(product.id._text)
                expect(product.title._text).not.toBeEmpty()
                expect(helper.validateImage(product.image_url._text)).toBeTrue()
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
        })
    })

    it('Verify total feeds sent to each service ' + config.baseUrl, async () => {
        let totalFeeds = facebookFeeds.length
        expect(totalFeeds).toEqual(googleFeeds.length)
        expect(totalFeeds).toEqual(googleDynamicFeeds.length)
        expect(totalFeeds).toEqual(criteoFeeds.length)
        expect(totalFeeds).toEqual(googleMerchantFeeds.feed.entry.length)
        expect(totalFeeds).toEqual(insiderFeeds.products.product.length)
    })
}

describe('Product feeds API', ProductFeedsTest)