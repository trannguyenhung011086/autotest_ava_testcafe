import config from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import faker from "faker/locale/vi"
import * as model from '../../../common/interface'
let signUp: model.SignIn

export const AccountSignUpTest = () => {
    it('POST / empty email and password', async () => {
        let response = await request.post(config.api.signUp,
            {
                "email": "", "password": "",
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('EMAIL_ADDRESS_REQUIRED')
    })

    it('POST / wrong format email', async () => {
        let response = await request.post(config.api.signUp,
            {
                "email": ".test%!@#$%^&*()_+<>?@mail.com", "password": config.testAccount.password,
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('REGISTER_INVALID_EMAIL')
    })

    it('POST / length < 7 password', async () => {
        let response = await request.post(config.api.signUp,
            {
                "email": faker.internet.email(), "password": "123",
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: password: Password should be longer')
    })

    it('POST / existing account', async () => {
        let response = await request.post(config.api.signUp,
            {
                "email": config.testAccount.email, "password": config.testAccount.password,
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('EMAIL_ALREADY_EXISTS')
    })

    it('POST / missing email field', async () => {
        let response = await request.post(config.api.signUp,
            {
                "password": faker.internet.password()
            })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('EMAIL_ADDRESS_REQUIRED')
    })

    it('POST / missing password field', async () => {
        let response = await request.post(config.api.signUp,
            {
                "email": faker.internet.email()
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: password: Password should be longer')
    })

    it('POST / successful', async () => {
        const email = faker.internet.email()
        let response = await request.post(config.api.signUp,
            {
                "email": email, "password": faker.internet.password(),
                "language": "vn", "gender": "M"
            })
        signUp = response.data
        expect(response.status).toEqual(200)
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