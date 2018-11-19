import { Browser, Utils } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
import 'jest-extended'
let browser: Browser
let pages: AllPages
let api: Utils

describe('View sale page on ' + config.browser + ' - ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = new Browser('chrome', config.device)
        pages = new AllPages(browser)
        api = new Utils()
        const sales = await api.getSaleWithManyProducts(config.api.currentSales)
        await browser.navigate(config.baseUrl + '/vn/sales/' + sales.slug)
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