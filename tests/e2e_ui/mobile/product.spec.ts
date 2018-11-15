import { Browser, Utils } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
import 'jest-extended'
let browser: Browser
let pages: AllPages
let api: Utils

describe('View product details on ' + config.browser + ' - ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = new Browser('chrome', config.device)
        pages = new AllPages(browser)
        api = new Utils()
        await browser.navigate(config.baseUrl)
    })

    test('View domestic product', async () => {
        const products = await api.getProducts(config.api.todaySales)
        await browser.navigate(config.baseUrl + '/vn/products/' + products[0].slug)
    })

    test('View international product', async () => {
        const products = await api.getProducts(config.api.internationalSales)
        await browser.navigate(config.baseUrl + '/vn/products/' + products[0].slug)
    })

    test('View featured domestic product', async () => {
        const products = await api.getProducts(config.api.featuredSales)
        await browser.navigate(config.baseUrl + '/vn/products/' + products[0].slug)
    })

    test('View featured international product', async () => {
        const products = await api.getProducts(config.api.featuredSales, 'international')
        await browser.navigate(config.baseUrl + '/vn/products/' + products[0].slug)
    })

    test('View POTD product', async () => {
        const products = await api.getProducts(config.api.potdSales)
        await browser.navigate(config.baseUrl + '/vn/products/' + products[0].slug)
    })

    afterAll(async () => {
        await browser.close()
    })
})