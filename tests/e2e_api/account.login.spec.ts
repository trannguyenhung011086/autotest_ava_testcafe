import config from '../../config/config'
import { Utils } from '../../common'
let request = new Utils()
import * as faker from 'faker'

describe('Login API', () => {
    test('POST / wrong email', async () => {
        let response = await request.post(config.api.login,
            {
                "email": faker.internet.email(), "password": faker.internet.password()
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    test('POST / wrong password', async () => {
        let response = await request.post(config.api.login,
            {
                "email": config.testAccount.email, "password": faker.internet.password()
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    test('POST / use Facebook email', async () => {
        let response = await request.post(config.api.login,
            {
                "email": config.testAccount.facebook, "password": config.testAccount.passwordFacebook
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    test('POST / Missing email field', async () => {
        let response = await request.post(config.api.login,
            {
                "password": faker.internet.password()
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    test('POST / Missing password field', async () => {
        let response = await request.post(config.api.login,
            {
                "email": faker.internet.email()
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    test('POST / empty email and password', async () => {
        let response = await request.post(config.api.login,
            {
                "email": "", "password": ""
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    test('POST / correct email and password', async () => {
        let response = await request.post(config.api.login,
            {
                "email": config.testAccount.email, "password": config.testAccount.password
            })
        expect(response.status).toEqual(200)
        expect(response.data.email).toEqual(config.testAccount.email)
        expect(response.data.provider).toEqual('local')
        expect(response.data.state).toEqual('confirmed')
    })

    test('GET / log out', async () => {
        let cookie = await request.getLogInCookie()
        let response = await request.get(config.api.logout, cookie)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('SIGNED_OUT_SUCCESSFUL')
    })
})