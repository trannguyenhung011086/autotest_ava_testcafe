import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as faker from "faker/locale/vi"
import * as model from '../../common/interface'
let signIn: model.SignIn
let cookie: string

describe('Update info API ' + config.baseUrl + config.api.account, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    test('PUT / can change name', async () => {
        let firstName = faker.name.firstName()
        let lastName = faker.name.lastName()
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
        expect(signIn.nsId).toBeUndefined() // fix after Netsuite release
    })

    test.skip('PUT / cannot change email', async () => {
        let response = await request.put(config.api.account,
            { "email": 'new-' + config.testAccount.email })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('USER_UPDATE_ERROR')
    }) // wait for WWW-335

    test('PUT / cannot update with wrong cookie', async () => {
        let response = await request.put(config.api.account,
            { "firstName": "first", "lastName": "last" }, 'connect-id=assdfds')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })
})

describe('Update password API ' + config.baseUrl + config.api.password, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    test('PUT / wrong current password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": faker.internet.password(),
                "newPassword": faker.internet.password()
            })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('COULD_NOT_CHANGE_PASSWORD')
    })

    test('PUT / empty current password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": "",
                "newPassword": faker.internet.password()
            })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('COULD_NOT_CHANGE_PASSWORD')
    })

    test('PUT / new password has length < 7', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": "123456"
            })
        expect(response.status).toEqual(500)
        expect(response.data).toMatch('ValidationError: User validation failed: password: Password should be longer')
    })

    test('PUT / empty new password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": ""
            })
        expect(response.status).toEqual(500)
        expect(response.data).toMatch('ValidationError: User validation failed: password: Password should be longer')
    })

    test('PUT / can change password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": config.testAccount.password
            })
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('PASSWORD_CHANGED')
    })

    test('PUT / cannot update password with wrong cookie', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": config.testAccount.password
            }, 'connect-id=assdfds')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })
})