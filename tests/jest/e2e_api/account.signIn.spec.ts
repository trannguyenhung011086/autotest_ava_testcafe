import config from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import faker from "faker/locale/vi"
import * as model from '../../../common/interface'
let signIn: model.SignIn

describe('Sign in API ' + config.baseUrl + config.api.signIn, () => {
    it('POST / wrong email', async () => {
        let response = await request.post(config.api.signIn,
            {
                "email": faker.internet.email(), "password": faker.internet.password()
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / wrong password', async () => {
        let response = await request.post(config.api.signIn,
            {
                "email": config.testAccount.email, "password": faker.internet.password()
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / use Facebook email', async () => {
        let response = await request.post(config.api.signIn,
            {
                "email": config.testAccount.facebook,
                "password": config.testAccount.passwordFacebook
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / missing email field', async () => {
        let response = await request.post(config.api.signIn,
            {
                "password": faker.internet.password()
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / missing password field', async () => {
        let response = await request.post(config.api.signIn,
            {
                "email": faker.internet.email()
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / empty email and password', async () => {
        let response = await request.post(config.api.signIn,
            {
                "email": "", "password": ""
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / correct email and password - external email', async () => {
        let response = await request.post(config.api.signIn,
            {
                "email": config.testAccount.email.toUpperCase(),
                "password": config.testAccount.password
            })
        signIn = response.data
        expect(response.status).toEqual(200)
        expect(signIn.id).not.toBeEmpty()
        expect(signIn.firstName).toBeString()
        expect(signIn.lastName).toBeString()
        expect(signIn.email).toEqual(config.testAccount.email.toLowerCase())
        expect(signIn.language).toMatch(/en|vn/)
        expect(signIn.accountCredit).toBeNumber()
        expect(signIn.provider).toEqual('local')
        expect(signIn.state).toEqual('confirmed')
        expect(signIn.preview).toBeFalse()
        expect(signIn.gender).toBeString()
        expect(signIn.cart).toBeArray()
        expect(signIn.nsId).not.toBeEmpty()
    })

    it('POST / correct email and password - internal email', async () => {
        let response = await request.post(config.api.signIn,
            {
                "email": "qa_tech@leflair.vn", "password": "leflairqa"
            })
        signIn = response.data
        expect(response.status).toEqual(200)
        expect(signIn.preview).toBeTrue()
    })

    it('GET / sign out', async () => {
        let response = await request.get(config.api.signOut)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('SIGNED_OUT_SUCCESSFUL')
    })
})