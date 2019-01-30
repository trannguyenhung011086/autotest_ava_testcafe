import { t } from 'testcafe'
import { config } from '../../../../config'
import * as faker from 'faker/locale/vi'
import { Pages } from '../page_objects'
const page = new Pages()

fixture('Sign in via email ' + config.baseUrl)
    .meta({ type: 'regression' })
    .page(config.baseUrl + config.signIn)
    .requestHooks(page.base.blockPopup)

test('Cannot sign in with empty email and password', async () => {
    await page.signIn.submitEmpty()
    await t.expect(await page.signIn.getEmailError()).eql(config.notifyMsg.missingEmail)
    await t.expect(await page.signIn.getPasswordError()).eql(config.notifyMsg.missingPassword)
})

test('Cannot sign in with non-existing email', async () => {
    await page.signIn.submitData(faker.internet.email(), faker.internet.password())
    await t.expect(await page.signIn.getCommonError()).eql(config.notifyMsg.invalidEmailPassword)
})

test('Cannot sign in with incorrect password', async () => {
    await page.signIn.submitData(config.testAccount.email, faker.internet.password())
    await t.expect(await page.signIn.getCommonError()).eql(config.notifyMsg.invalidEmailPassword)
})

test('Cannot sign in with Facebook email', async () => {
    await page.signIn.submitData(config.testAccount.facebook, faker.internet.password())
    await t.expect(await page.signIn.getCommonError()).eql(config.notifyMsg.invalidEmailPassword)
})

test('Can sign in with existing email', async () => {
    await page.signIn.submitData(config.testAccount.email, config.testAccount.password)
    await t.expect(await page.signIn.getSuccessMsg()).match(/^Chào mừng.+quay trở lại!$/)
})

// test('Log out sucessfully', async () => {
//     // TO DO
// })