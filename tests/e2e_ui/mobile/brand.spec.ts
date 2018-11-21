import { Browser, Utils } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
import 'jest-extended'
let browser: Browser
let pages: AllPages
let api: Utils
import * as model from '../../../common/interface'
let brandWithProducts: model.BrandInfo
let brandWithNoProduct: model.BrandInfo

describe('View brand page on ' + config.device + ' - ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = new Browser('chrome', config.device)
        pages = new AllPages(browser)
        api = new Utils()
        brandWithProducts = await api.getBrandWithProducts()
        await browser.navigate(config.baseUrl + '/brands/' + brandWithProducts.id)
        await pages.popup.closeBoardingPopup()
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
        expect(numOfItems).toEqual(brandWithProducts.products.length)
    })

    test('Check brand name and description', async () => {
        const brandTitle = await pages.brand.getBrandTitle()
        const brandFooterName = (await pages.brand.getBrandFooter())['name']
        const brandFooterDescription = (await pages.brand.getBrandFooter())['description']

        expect(brandTitle).toEqual(brandWithProducts.name)
        expect(brandFooterName).toEqual(brandWithProducts.name)
        expect(brandFooterDescription).toEqual(brandWithProducts.description)
    })

    afterAll(async () => {
        await browser.close()
    })
})

describe('View empty brand page on ' + config.device + ' - ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = new Browser('chrome', config.device)
        pages = new AllPages(browser)
        api = new Utils()
        brandWithNoProduct = await api.getBrandWithNoProduct()
        await browser.navigate(config.baseUrl + '/brands/' + brandWithNoProduct.id)
        await pages.popup.closeBoardingPopup()
    })

    test('Check brand name and description', async () => {
        const brandTitle = await pages.brand.getBrandTitle()
        const brandFooterName = (await pages.brand.getBrandFooter())['name']
        const brandFooterDescription = (await pages.brand.getBrandFooter())['description']

        expect(brandTitle).toEqual(brandWithNoProduct.name)
        expect(brandFooterName).toEqual(brandWithNoProduct.name)
        expect(brandFooterDescription).toEqual(brandWithNoProduct.description)
    })

    test('Check subcribe content', async () => {
        const brandTitle = await pages.brand.getBrandTitle()
        const subcribeSorry = (await pages.brand.getSubcribeContent())['text']
        const subcribeBrand = (await pages.brand.getSubcribeContent())['brand']
        const subcribeCheck = (await pages.brand.getSubcribeContent())['check']

        expect(subcribeSorry).not.toBeEmpty()
        expect(subcribeBrand).toInclude(brandTitle)
        expect(subcribeCheck).not.toBeEmpty()
    })

    afterAll(async () => {
        await browser.close()
    })
})