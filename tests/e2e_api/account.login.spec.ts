import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as faker from "faker/locale/vi"
import * as model from '../../common/interface'
let signIn: model.SignIn

describe('Login API '  + config.baseUrl + config.api.login, () => {
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
                "email": config.testAccount.facebook, 
                "password": config.testAccount.passwordFacebook
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    test('POST / missing email field', async () => {
        let response = await request.post(config.api.login,
            {
                "password": faker.internet.password()
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    test('POST / missing password field', async () => {
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
                "email": config.testAccount.email, 
                "password": config.testAccount.password
            })
        signIn = response.data
        expect(response.status).toEqual(200)
        expect(signIn.id).not.toBeEmpty()
        expect(signIn.firstName).toBeString()
        expect(signIn.lastName).toBeString()
        expect(signIn.email).toEqual(config.testAccount.email)
        expect(signIn.language).toMatch(/en|vn/)
        expect(signIn.accountCredit).toBeNumber()
        expect(signIn.provider).toEqual('local')
        expect(signIn.state).toEqual('confirmed')
        expect(signIn.preview).toBeTrue()
        expect(signIn.nsId).toBeString()
        expect(signIn.gender).toBeString()
        expect(signIn.cart).toBeArray()
    })

    test('GET / log out', async () => {
        let cookie = await request.getLogInCookie()
        let response = await request.get(config.api.logout, cookie)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('SIGNED_OUT_SUCCESSFUL')
    })

    test('POST / internal Leflair email', async () => {
        let response = await request.post(config.api.login,
            {
                "email": "hungtn@leflair.vn", "password": "0944226282"
            })
        signIn = response.data
        expect(response.status).toEqual(200)
        expect(signIn.preview).toBeTrue()
    })
})