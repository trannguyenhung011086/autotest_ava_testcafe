import { Browser } from '../../../common'
import * as Utils from '../../../common/utils'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
import 'jest-extended'
let browser: Browser
let pages: AllPages
let api: Utils.ApiUtils

describe('View product details on ' + config.browser + ' - ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = new Browser(config.browser)
        pages = new AllPages(browser)
        api = new Utils.ApiUtils()
        await browser.navigate(config.baseUrl)
        await pages.popup.closePopup()
    })

    test('View domestic product', async () => {
        const products = await api.getProducts(config.api.todaySales)
        await browser.navigate(config.baseUrl + '/vn/products/' + products[0].slug)
    })

    test('View international product', async () => {
        const products = await api.getProducts(config.api.internationalSales)
        await browser.navigate(config.baseUrl + '/vn/products/' + products[0].slug)
    })

    test('View featured product', async () => {
        const products = await api.getProducts(config.api.featuredSales)
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