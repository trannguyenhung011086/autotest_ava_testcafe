import { Browser, Utils } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
let browser: Browser
let pages: AllPages

describe('New test', () => {
    beforeAll(async () => {
        browser = new Browser('chrome', config.device)
        pages = new AllPages(browser)
        await browser.navigate(config.baseUrl)
    })

    test('New test', async () => {
        await pages.popup.closePopupMobile()
        await browser.wait(10000)
    })

    afterAll(async () => {
        await browser.close()
    })
})