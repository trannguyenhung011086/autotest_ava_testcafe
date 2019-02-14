import { config } from '../../../config'
import * as Utils from '../../../common/utils'
import faker from 'faker/locale/vi'
import * as model from '../../../common/interface'

let signUp: model.SignIn
let request = new Utils.AccountUtils

export const AccountSignUpTest = () => {
    it('POST / empty email and password', async () => {
        let res = await request.post(config.api.signUp,
            {
                "email": "",
                "password": "",
                "language": "vn",
                "gender": "M"
            })

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('EMAIL_ADDRESS_REQUIRED')
    })

    it('POST / wrong format email', async () => {
        let res = await request.post(config.api.signUp,
            {
                "email": ".test%!@#$%^&*()_+<>?@mail.com",
                "password": config.testAccount.password,
                "language": "vn",
                "gender": "M"
            })

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('REGISTER_INVALID_EMAIL')
    })

    it('POST / length < 7 password', async () => {
        let res = await request.post(config.api.signUp,
            {
                "email": 'QA_' + faker.internet.email(),
                "password": "123",
                "language": "vn",
                "gender": "M"
            })

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('User validation failed: password: Password should be longer')
    })

    it('POST / existing account', async () => {
        let res = await request.post(config.api.signUp,
            {
                "email": config.testAccount.email,
                "password": config.testAccount.password,
                "language": "vn",
                "gender": "M"
            })

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('EMAIL_ALREADY_EXISTS')
    })

    it('POST / missing email field', async () => {
        let res = await request.post(config.api.signUp,
            {
                "password": faker.internet.password()
            })

        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('EMAIL_ADDRESS_REQUIRED')
    })

    it('POST / missing password field', async () => {
        let res = await request.post(config.api.signUp,
            {
                "email": 'QA_' + faker.internet.email()
            })

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('User validation failed: password: Password should be longer')
    })

    it('POST / successful', async () => {
        const email = 'QA_' + faker.internet.email()
        let res = await request.post(config.api.signUp,
            {
                "email": email,
                "password": faker.internet.password(),
                "language": "vn",
                "gender": "M"
            })
        signUp = res.body

        expect(res.statusCode).toEqual(200)
        expect(signUp.id).not.toBeEmpty()
        expect(signUp.firstName).toBeEmpty()
        expect(signUp.lastName).toBeEmpty()
        expect(signUp.email).toEqual(email.toLowerCase())
        expect(signUp.language).toEqual('vn')
        expect(signUp.accountCredit).toEqual(0)
        expect(signUp.provider).toEqual('local')
        expect(signUp.state).toEqual('confirmed')
        expect(signUp.preview).toBeFalse()
        expect(signUp.gender).toEqual('M')
        expect(signUp.cart).toBeArrayOfSize(0)
    })
}

describe('Register API ' + config.baseUrl + config.api.signUp, AccountSignUpTest)