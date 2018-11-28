import { Browser } from '../../../common'
import * as Utils from '../../../common/utils'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
import 'jest-extended'
let browser: Browser
let pages: AllPages
let api: Utils.ApiUtils

describe('View sale page on ' + config.browser + ' - ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = new Browser(config.browser)
        pages = new AllPages(browser)
        api = new Utils.ApiUtils()
        const sales = await api.getSaleWithManyProducts(config.api.featuredSales)
        await browser.navigate(config.baseUrl + '/vn/sales/' + sales.slug)
        await pages.popup.closePopup()
    })

    test('Get product card info', async () => {
        const info = await pages.productList.getProductInfo()
        const apiInfo = await api.getProductInfo(info.id)

        expect(info.brand).toEqual(apiInfo.brand.name)
        expect(info.title).toEqual(apiInfo.title)

        for (let product of apiInfo.products) {
            if (product.inStock == true) {
                expect(info.retailPrice).toEqual(product.retailPrice)
                expect(info.salePrice).toEqual(product.salePrice)
            }
        }
    })

    test('Display all items without lazyloading', async () => {
        const numOfItems = await pages.productList.getNumItems()
        const filterNum = await pages.productList.getFilterNum()
        expect(numOfItems).toEqual(filterNum)
        expect(numOfItems).toBeGreaterThan(60)
    })

    afterAll(async () => {
        await browser.close()
    })
})