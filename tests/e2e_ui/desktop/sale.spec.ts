import { Browser, Utils } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
let browser: Browser
let pages: AllPages
let api: Utils

describe('View sale page', () => {
    beforeAll(async () => {
        browser = new Browser(config.browser)
        pages = new AllPages(browser)
        api = new Utils()
        const sales = await api.getSaleWithManyProducts(config.api.trendingApparel)
        await browser.navigate(config.baseUrl + '/vn/sales/' + sales['slug'])
        await pages.popup.closePopup()
    })

    test('Get product card info', async () => {
        const info = await pages.productList.getProductInfo()
        const apiInfo = await api.getProductInfo(info.id)

        expect(info.brand).toEqual(apiInfo.brand.name)
        expect(info.title).toEqual(apiInfo.title)
        expect(info.retailPrice).toEqual(apiInfo.products[0].retailPrice)
        expect(info.salePrice).toEqual(apiInfo.products[0].salePrice)
    })

    test('Display all items without lazyloading', async () => {
        const numOfItems = await pages.productList.getNumItems()
        const filterNum = await pages.productList.getFilterNum()
        expect(numOfItems).toEqual(filterNum)
    })

    afterAll(async () => {
        await browser.close()
    })
})