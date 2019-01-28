import { t } from 'testcafe'
import config from '../../../../config'
import * as faker from 'faker/locale/vi'
import Pages from '../page_objects'
const page = new Pages()

fixture('Sign up via email ' + config.baseUrl)
    .meta({ type: 'regression' })    
    .page(config.baseUrl + config.signUp)
    .requestHooks(page.base.blockPopup)

test('Cannot sign up with empty email and password', async () => {
    await page.signUp.submitEmpty()
    await t
        .expect(await page.signUp.getEmailError()).eql('Vui lòng nhập email.')
        .expect(await page.signUp.getPasswordError()).eql('Vui lòng nhập password.')
})

test('Cannot sign up with wrong format email', async () => {
    await page.signUp.submitData(faker.random.words(), faker.internet.password())
    await t.expect(await page.signUp.getEmailError()).eql('Địa chỉ email không đúng')
})

test('Cannot sign up with length < 7 password', async () => {
    await page.signUp.submitData(faker.internet.email(), '123456')
    await t.expect(await page.signUp.getPasswordError()).eql('Mật khẩu phải dài ít nhất 7 ký tự')
})

test('Cannot sign up with existing account', async () => {
    await page.signUp.submitData(config.testAccount.email, config.testAccount.password)
    await t.expect(await page.signUp.getCommonError()).eql('Email đã đăng ký. Vui lòng đăng nhập')
})

test('Can sign up successfully', async () => {
    await page.signUp.submitData(faker.internet.email(), faker.internet.password())
    await t.expect(await page.signUp.getSuccessMsg()).eql('Chào mừng bạn đến với Leflair!')
})