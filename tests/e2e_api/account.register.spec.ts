import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as faker from "faker/locale/vi"
import * as model from '../../common/interface'
let signUp: model.SignIn

describe('Register API ' + config.baseUrl + config.api.register, () => {
    test('POST / empty email and password', async () => {
        let response = await request.post(config.api.register,
            {
                "email": "", "password": "",
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: password: Password should be longer, email: Please fill in your email')
    })

    test('POST / wrong format email', async () => {
        let response = await request.post(config.api.register,
            {
                "email": "test%!@#$%^&*()_+<>?", "password": config.testAccount.password,
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: email: Please fill a valid email address')
    })

    test('POST / length < 7 password', async () => {
        let response = await request.post(config.api.register,
            {
                "email": faker.internet.email(), "password": "123",
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: password: Password should be longer')
    })

    test('POST / existing account', async () => {
        let response = await request.post(config.api.register,
            {
                "email": config.testAccount.email, "password": config.testAccount.password,
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('EMAIL_ALREADY_EXISTS')
    })

    test('POST / missing email field', async () => {
        let response = await request.post(config.api.register,
            {
                "password": faker.internet.password()
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: email: Please fill in your email')
    })

    test('POST / missing password field', async () => {
        let response = await request.post(config.api.register,
            {
                "email": faker.internet.email()
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: password: Password should be longer')
    })

    test('POST / successful', async () => {
        const email = faker.internet.email()
        let response = await request.post(config.api.register,
            {
                "email": email, "password": faker.internet.password(),
                "language": "vn", "gender": "M"
            })
        signUp = response.data
        expect(response.status).toEqual(200)
        expect(signUp.id).not.toBeEmpty()
        expect(signUp.firstName).toBeEmpty()
        expect(signUp.lastName).toBeEmpty()
        expect(signUp.email).toEqual(email)
        expect(signUp.language).toEqual('vn')
        expect(signUp.accountCredit).toEqual(0)
        expect(signUp.provider).toEqual('local')
        expect(signUp.state).toEqual('confirmed')
        expect(signUp.preview).toBeFalse()
        expect(signUp.gender).toEqual('M')
        expect(signUp.cart).toBeArrayOfSize(0)
    })
})