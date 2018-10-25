import { Browser } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
let browser: Browser
let pages: AllPages

describe('Switch language', () => {
    beforeAll(async () => {
        browser = new Browser('chrome', config.device)
        pages = new AllPages(browser)
        await browser.navigate(config.baseUrl)
        await browser.setCokie(config.cookieEma)
    })

    test('Switch to English', async() => {
        await pages.header.switchToEnMobile()
        var active = await pages.header.getLangActiveMobile()
        expect(active).toEqual('En')
    })

    test('Switch to Vietnamese', async() => {
        await browser.navigate(config.baseUrl)
        await pages.header.switchToVnMobile()
        var active = await pages.header.getLangActiveMobile()
        expect(active).toEqual('Vn')
    })

    afterAll(async () => {
        await browser.close()
    })
})