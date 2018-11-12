import config from '../../config/config'
import { Utils } from '../../common'
let request = new Utils()
import * as faker from 'faker'

describe('Update password API '  + config.baseUrl, () => {
    var cookie: string
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    test('PUT / wrong current password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": faker.internet.password(),
                "newPassword": faker.internet.password()
            },
            cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('COULD_NOT_CHANGE_PASSWORD')
    })

    test('PUT / empty current password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": "",
                "newPassword": faker.internet.password()
            },
            cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('COULD_NOT_CHANGE_PASSWORD')
    })

    test('PUT / new password has length < 7', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": "123456"
            },
            cookie)
        expect(response.status).toEqual(500)
        expect(response.data).toMatch('ValidationError: User validation failed: password: Password should be longer')
    })

    test('PUT / empty new password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": ""
            },
            cookie)
        expect(response.status).toEqual(500)
        expect(response.data).toMatch('ValidationError: User validation failed: password: Password should be longer')
    })

    test('PUT / wrong cookie access denied', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": config.testAccount.password
            },
            'connect-id=assdfds')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })

    test('PUT / can change password', async () => {
        let response = await request.put(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": config.testAccount.password
            },
            cookie)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('PASSWORD_CHANGED')
    })
})