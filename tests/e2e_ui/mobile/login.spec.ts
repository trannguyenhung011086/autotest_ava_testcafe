import { Browser } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
let browser: Browser
let pages: AllPages
import * as faker from 'faker'

describe('Log in via email', () => {
    beforeAll(async () => {
        browser = new Browser('chrome', config.device)
        pages = new AllPages(browser)
        await browser.navigate(config.baseUrl + config.signin)
    })

    test('Use empty email and password', async () => {
        await pages.login.submitWithEmail('', '')
        
        var error = await pages.login.getEmailError()
        expect(error).toEqual('Vui lòng nhập email.')

        error = await pages.login.getPasswordError()
        expect(error).toEqual('Vui lòng nhập password.')
    })

    test('Use non-existing email', async () => {
        await pages.login.submitWithEmail(faker.internet.email(), faker.internet.password())
        var error = await pages.login.getErrorText()
        expect(error).toEqual('Email hoặc mật khẩu không đúng. Vui lòng thử lại')
    })

    test('Use incorrect password', async () => {
        await pages.login.submitWithEmail(config.testAccount.email, faker.internet.password())
        var error = await pages.login.getErrorText()
        expect(error).toEqual('Email hoặc mật khẩu không đúng. Vui lòng thử lại')
    })

    test('Use Facebook email', async () => {
        await pages.login.submitWithEmail(config.testAccount.facebook, faker.internet.password())
        var error = await pages.login.getErrorText()
        expect(error).toEqual('Email hoặc mật khẩu không đúng. Vui lòng thử lại')
    })
    
    test('Log in with existing email', async () => {
        await pages.login.submitWithEmail(config.testAccount.email, config.testAccount.password)
        var success = await pages.login.getSuccessText()
        expect(success).toMatch(/^Chào mừng.+quay trở lại!$/)
    })

    afterAll(async () => {
        await browser.close()
    })
})