import { Browser } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
let browser: Browser
let pages: AllPages
import * as faker from 'faker'

describe('Log in failed', () => {
    beforeAll(async () => {
        browser = new Browser('chrome', config.device)
        pages = new AllPages(browser)
        await browser.navigate(config.baseUrl + config.signin)
        // add cookie
        await browser.setCokie(config.cookieEma)
    })

    test('Use empty email and password', async () => {
        await pages.login.submitWithEmail('', '')
        var error = await pages.login.getEmailError()
        expect(error).toEqual('Vui lòng nhập email.')
        error = await pages.login.getPasswordError()
        expect(error).toEqual('Vui lòng nhập password.')
    })

    test.each([[faker.internet.email(), faker.internet.password()],
    [config.testAccount.email, faker.internet.password()],
    [config.testAccount.facebook, faker.internet.password()]])
        ('Use invalid credentials: %s %s', async (email: string, password: string) => {
            await pages.login.submitWithEmail(email, password)
            var error = await pages.login.getErrorText()
            expect(error).toEqual('Email hoặc mật khẩu không đúng. Vui lòng thử lại')
        })

    afterAll(async () => {
        await browser.close()
    })
})

describe('Log in successfully', () => {
    beforeAll(async () => {
        browser = new Browser('chrome', config.device)
        pages = new AllPages(browser)
        await browser.navigate(config.baseUrl + config.signin)
        // add cookie
        await browser.setCokie(config.cookieEma)
    })

    test('Log in with existing email', async () => {
        await pages.login.submitWithEmail(config.testAccount.email, config.testAccount.password)
        var success = await pages.login.getSuccessText()
        expect(success).toMatch(/Chào mừng .+ quay trở lại!/)
    })

    test('Log out successfully', async () => {
        await pages.header.logOutMobile()
        expect(await browser.isVisible(pages.header.registerBtnMobile)).toBe(true)
    })

    afterAll(async () => {
        await browser.close()
    })
})