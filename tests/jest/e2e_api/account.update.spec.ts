import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import faker from "faker/locale/vi"
import * as model from '../../../common/interface'
let account: model.Account
let signIn: model.SignIn
let cookie: string

export const AccountInfoTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    it('GET / get account info', async () => {
        let response = await request.get(config.api.account)
        expect(response.status).toEqual(200)
        account = response.data
        expect(account.id).not.toBeEmpty()
        expect(account.firstName).not.toBeEmpty()
        expect(account.lastName).not.toBeEmpty()
        expect(account.email).toEqual(config.testAccount.email)
        expect(account.language).toMatch(/en|vn/)
        expect(account.accountCredit).toBeNumber()
        expect(account.provider).toEqual('local')
        expect(account.state).toEqual('confirmed')
        expect(account.gender).toBeString()
        expect(account.nsId).not.toBeEmpty()
        expect(account.cart).toBeArray()

        if (account.stripe) {
            expect(account.stripe.customerId).not.toBeEmpty()
        }
    })
}

export const AccountUpdateInfoTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    it('PUT / can change name', async () => {
        let firstName = 'QA_' + faker.name.firstName()
        let lastName = 'QA_' + faker.name.lastName()
        let response = await request.put(config.api.account,
            { "firstName": firstName, "lastName": lastName })
        signIn = response.data
        expect(response.status).toEqual(200)
        expect(signIn.id).not.toBeEmpty()
        expect(signIn.firstName).toEqual(firstName)
        expect(signIn.lastName).toEqual(lastName)
        expect(signIn.email).toEqual(config.testAccount.email)
        expect(signIn.language).toMatch(/en|vn/)
        expect(signIn.accountCredit).toBeNumber()
        expect(signIn.provider).toEqual('local')
        expect(signIn.state).toEqual('confirmed')
        expect(signIn.gender).toBeString()
        expect(signIn.nsId).not.toBeEmpty()
    })

    test.skip('PUT / cannot change email', async () => {
        let response = await request.put(config.api.account,
            { "email": 'new-' + config.testAccount.email })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('USER_UPDATE_ERROR')
    }) // wait for WWW-335

    it('PUT / cannot update with wrong cookie', async () => {
        let response = await request.put(config.api.account,
            { "firstName": "first", "lastName": "last" }, 'connect-id=assdfds')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })
}

export const AccountUpdatePasswordTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    it('PUT / wrong current password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": faker.internet.password(),
                "newPassword": faker.internet.password()
            })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('COULD_NOT_CHANGE_PASSWORD')
    })

    it('PUT / empty current password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": "",
                "newPassword": faker.internet.password()
            })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('COULD_NOT_CHANGE_PASSWORD')
    })

    it('PUT / new password has length < 7', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": "123456"
            })
        expect(response.status).toEqual(500)
        expect(response.data).toMatch('ValidationError: User validation failed: password: Password should be longer')
    })

    it('PUT / empty new password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": ""
            })
        expect(response.status).toEqual(500)
        expect(response.data).toMatch('ValidationError: User validation failed: password: Password should be longer')
    })

    it('PUT / can change password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": config.testAccount.password
            })
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('PASSWORD_CHANGED')
    })

    it('PUT / cannot update password with wrong cookie', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": config.testAccount.password
            }, 'connect-id=assdfds')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })
}

describe('Update info API ' + config.baseUrl + config.api.account, AccountUpdateInfoTest)
describe('Update password API ' + config.baseUrl + config.api.password, AccountUpdatePasswordTest)