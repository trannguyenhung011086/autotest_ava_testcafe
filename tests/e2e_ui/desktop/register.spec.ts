import { Browser } from '../../../common'
import config from '../../../config/config'
import { AllPages } from '../../../page_objects'
let browser: Browser
let pages: AllPages
import * as faker from "faker/locale/vi"
import 'jest-extended'

describe('Register via email on ' + config.browser + ' - ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = new Browser(config.browser)
        pages = new AllPages(browser)
        await browser.navigate(config.baseUrl + config.signUp)
        await pages.popup.closePopup()
    })

    test('Register with empty email and password', async () => {
        await pages.login.submitWithEmail('', '')

        var error = await pages.login.getEmailError()
        expect(error).toEqual('Vui lòng nhập email.')

        error = await pages.login.getPasswordError()
        expect(error).toEqual('Vui lòng nhập password.')
    })

    test('Register with wrong format email', async () => {
        await pages.login.submitWithEmail('test@mail', faker.internet.password())

        var error = await pages.login.getEmailError()
        expect(error).toEqual('Địa chỉ email không đúng')
    })

    test('Register with length < 7 password', async () => {
        await pages.login.submitWithEmail(faker.internet.email(), '123456')

        var error = await pages.login.getPasswordError()
        expect(error).toEqual('Mật khẩu phải dài ít nhất 7 ký tự')
    })

    test('Register with existing account', async () => {
        await pages.login.submitWithEmail(config.testAccount.email, config.testAccount.password)

        var error = await pages.login.getErrorText()
        expect(error).toEqual('Email đã đăng ký. Vui lòng đăng nhập')
    })

    test('Register successfully', async () => {
        await pages.login.submitWithEmail(faker.internet.email(), faker.internet.password())
        
        var success = await pages.login.getSuccessText()
        expect(success).toEqual('Chào mừng bạn đến với Leflair!')
    })

    afterAll(async () => {
        await browser.close()
    })
})