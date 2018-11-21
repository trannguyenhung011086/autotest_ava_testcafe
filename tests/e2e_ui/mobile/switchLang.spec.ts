import { Browser } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
import 'jest-extended'
let browser: Browser
let pages: AllPages

describe('Switch language on ' + config.device + ' - ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = new Browser('chrome', config.device)
        pages = new AllPages(browser)
        await browser.navigate(config.baseUrl)
        await pages.popup.closeBoardingPopup()
    })

    test('Switch to English', async() => {
        await browser.navigate(config.baseUrl)
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