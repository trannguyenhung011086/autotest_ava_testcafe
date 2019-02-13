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
        cookie = await request.getLogInCookie('qa_tech@leflair.vn', 'leflairqa')
    })

    it('GET / get account info', async () => {
        let res = await request.get(config.api.account, cookie)
        account = res.body

        expect(res.statusCode).toEqual(200)
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

        if (account.stripe && Object.keys(account.stripe).length > 0) {
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

        let res = await request.put(config.api.account, {
            "firstName": firstName,
            "lastName": lastName
        }, cookie)
        signIn = res.body

        expect(res.statusCode).toEqual(200)
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
        let res = await request.put(config.api.account, {
            "email": 'new-' + config.testAccount.email
        }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('USER_UPDATE_ERROR')
    }) // wait for WWW-335

    it('PUT / cannot update with wrong cookie', async () => {
        let res = await request.put(config.api.account, {
            "firstName": "first",
            "lastName": "last"
        }, 'leflair.connect2.sid=test')

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('Access denied.')
    })
}

export const AccountUpdatePasswordTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    it('PUT / wrong current password', async () => {
        let res = await request.put(config.api.password,
            {
                "currentPassword": faker.internet.password(),
                "newPassword": faker.internet.password()
            }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('COULD_NOT_CHANGE_PASSWORD')
    })

    it('PUT / empty current password', async () => {
        let res = await request.put(config.api.password,
            {
                "currentPassword": "",
                "newPassword": faker.internet.password()
            }, cookie)

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('COULD_NOT_CHANGE_PASSWORD')
    })

    it('PUT / new password has length < 7', async () => {
        let res = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": "123456"
            }, cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body).toMatch('Internal Server Error')
    })

    it('PUT / empty new password', async () => {
        let res = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": ""
            }, cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body).toMatch('Internal Server Error')
    })

    it('PUT / can change password', async () => {
        let res = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": config.testAccount.password
            }, cookie)

        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('PASSWORD_CHANGED')
    })

    it('PUT / cannot update password with wrong cookie', async () => {
        let res = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": config.testAccount.password
            }, 'leflair.connect2.sid=test')

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('Access denied.')
    })
}

describe('Get account info API ' + config.baseUrl + config.api.account, AccountInfoTest)
describe('Update info API ' + config.baseUrl + config.api.account, AccountUpdateInfoTest)
describe('Update password API ' + config.baseUrl + config.api.password, AccountUpdatePasswordTest)