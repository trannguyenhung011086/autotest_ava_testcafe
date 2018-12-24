import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as model from '../../common/interface'
import Papa from 'papaparse'
let facebookFeeds: model.FacebookFeeds[]
let googleFeeds: model.GoogleFeeds[]
let googleDynamicFeeds: model.GoogleDynamicFeeds[]

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
                let feedId = feed.id.split('_')[0]
                expect(feed.link).toInclude(feedId)

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
                let feedId = feed.ID.split('_')[0]
                expect(feed["Final URL"]).toInclude(feedId)
                expect(feed["Final mobile URL"]).toInclude(feedId)

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
})