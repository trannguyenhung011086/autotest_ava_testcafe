import { Browser, Utils } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
let browser: Browser
let pages: AllPages
let api: Utils
let products: any[]

describe('View product details', () => {
    beforeAll(async () => {
        browser = new Browser(config.browser)
        pages = new AllPages(browser)
        api = new Utils()
        await browser.navigate(config.baseUrl)
        await pages.popup.closePopup()
    })

    test('View domestic product', async () => {
        products = await api.getProducts(config.api.todaySales)
        await browser.navigate(config.baseUrl + '/vn/products/' + products[0]['slug'])
    })

    test('View international product', async () => {
        products = await api.getProducts(config.api.internationalSales)
        await browser.navigate(config.baseUrl + '/vn/products/' + products[0]['slug'])
    })

    test('View featured domestic product', async () => {
        products = await api.getProducts(config.api.featuredSales)
        await browser.navigate(config.baseUrl + '/vn/products/' + products[0]['slug'])
    })

    test('View POTD product', async () => {
        products = await api.getProducts(config.api.potdSales)
        await browser.navigate(config.baseUrl + '/vn/products/' + products[0]['slug'])
    })

    afterAll(async () => {
        await browser.close()
    })
})