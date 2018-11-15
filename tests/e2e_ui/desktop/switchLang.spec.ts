import { Browser } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
import 'jest-extended'
let browser: Browser
let pages: AllPages

describe('Switch language on ' + config.browser + ' - ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = new Browser(config.browser)
        pages = new AllPages(browser)
        await browser.navigate(config.baseUrl)
    })

    test('Switch to English', async() => {
        await pages.header.switchToEn()

        var active = await pages.header.getLangActive()
        expect(active).toEqual('En')
    })

    test('Switch to Vietnamese', async() => {
        await pages.header.switchToVn()
        
        var active = await pages.header.getLangActive()
        expect(active).toEqual('Vn')
    })

    afterAll(async () => {
        await browser.close()
    })
})