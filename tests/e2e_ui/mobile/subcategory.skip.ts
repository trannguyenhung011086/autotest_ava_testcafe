import { Browser, Utils } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
import 'jest-extended'
let browser: Browser
let pages: AllPages

describe('View subcategory page on ' + config.device + ' - ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = new Browser('chrome', config.device)
        pages = new AllPages(browser)
        await browser.navigate(config.baseUrl + '/vn/subcategories/thoi-trang-nu-5b56d3448f0dd7c0480acd1c')
        await pages.popup.closeBoardingPopup()
    })

    test('Get product card info', async () => {
        const info = await pages.productList.getProductInfo()
        const product_info = await new Utils().get(config.api.product + info.id)
        
        expect(info.brand).toEqual(product_info.data.brand.name)
        expect(info.title).toEqual(product_info.data.title)
        expect(info.retailPrice).toEqual(product_info.data.products[0].retailPrice)
        expect(info.salePrice).toEqual(product_info.data.products[0].salePrice)
    })

    test('Lazy load new items', async () => {
        const numOfItems = await pages.productList.getNumItems()
        const filterNum = await pages.productList.getFilterNum()
        expect(numOfItems).toEqual(filterNum)

        const numLazyLoadItems = await pages.productList.getNumLazyLoadItems(filterNum)
        expect(numLazyLoadItems).toEqual(filterNum + 30)

        const newFilterNum = await pages.productList.getFilterNum()
        expect(newFilterNum).toEqual(filterNum + 30)
    })

    afterAll(async () => {
        await browser.close()
    })
})