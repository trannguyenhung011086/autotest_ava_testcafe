import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import faker from 'faker/locale/vi'
import * as model from '../../../common/interface'

let signIn: model.SignIn
let request = new Utils.AccountUtils

export const AccountSignInTest = () => {
    it('POST / wrong email', async () => {
        let res = await request.post(config.api.signIn,
            {
                "email": 'QA_' + faker.internet.email(),
                "password": faker.internet.password()
            })

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / wrong password', async () => {
        let res = await request.post(config.api.signIn,
            {
                "email": config.testAccount.email,
                "password": faker.internet.password()
            })

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / use Facebook email', async () => {
        let res = await request.post(config.api.signIn,
            {
                "email": config.testAccount.facebook,
                "password": config.testAccount.passwordFacebook
            })

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / missing email field', async () => {
        let res = await request.post(config.api.signIn,
            {
                "password": faker.internet.password()
            })

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / missing password field', async () => {
        let res = await request.post(config.api.signIn,
            {
                "email": 'QA_' + faker.internet.email()
            })

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / empty email and password', async () => {
        let res = await request.post(config.api.signIn,
            {
                "email": "",
                "password": ""
            })

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    it('POST / correct email and password - external email', async () => {
        let res = await request.post(config.api.signIn,
            {
                "email": config.testAccount.email.toUpperCase(),
                "password": config.testAccount.password
            })
        signIn = res.body

        expect(res.statusCode).toEqual(200)
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
        let res = await request.post(config.api.signIn,
            {
                "email": "qa_tech@leflair.vn",
                "password": "leflairqa"
            })
        signIn = res.body

        expect(res.statusCode).toEqual(200)
        expect(signIn.preview).toBeTrue()
    })

    it('GET / sign out', async () => {
        let cookie = await request.getLogInCookie(config.testAccount.email, config.testAccount.password)
        let res = await request.get(config.api.signOut, cookie)

        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('SIGNED_OUT_SUCCESSFUL')
    })
}

describe('Sign in API ' + config.baseUrl + config.api.signIn, AccountSignInTest)