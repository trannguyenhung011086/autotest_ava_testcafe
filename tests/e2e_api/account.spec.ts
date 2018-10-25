import config from '../../config/config'
import { Utils } from '../../common'
let request = new Utils()
import * as faker from 'faker'

describe('Login API', () => {
    test.each([[faker.internet.email(), faker.internet.password()],
    [config.testAccount.email, faker.internet.password()],
    [config.testAccount.facebook, faker.internet.password()]])
        ('POST / invalid credentials: %s %s', async (email: string, password: string) => {
            let response = await request.makePost(config.api.login,
                {
                    "email": email, "password": password
                })
            expect(response.status).toEqual(401)
            expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
        })

    test('POST / Missing email field', async () => {
        let response = await request.makePost(config.api.login,
            {
                "password": faker.internet.password()
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    test('POST / Missing password field', async () => {
        let response = await request.makePost(config.api.login,
            {
                "email": faker.internet.email()
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    test('POST / empty email and password', async () => {
        let response = await request.makePost(config.api.login,
            {
                "email": "", "password": ""
            })
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('EMAIL_PASSWORD_INCORRECT')
    })

    test('POST / correct email and password', async () => {
        let response = await request.makePost(config.api.login,
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
        let response = await request.makeGet(config.api.logout, cookie)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('SIGNED_OUT_SUCCESSFUL')
    })
})

describe('Register API', () => {
    test('POST / empty email and password', async () => {
        let response = await request.makePost(config.api.register,
            {
                "email": "", "password": "",
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: password: Password should be longer, email: Please fill in your email')
    })

    test('POST / wrong format email', async () => {
        let response = await request.makePost(config.api.register,
            {
                "email": "test%!@#$%^&*()_+<>?", "password": config.testAccount.password,
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: email: Please fill a valid email address')
    })

    test('POST / length < 7 password', async () => {
        let response = await request.makePost(config.api.register,
            {
                "email": faker.internet.email(), "password": "123",
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: password: Password should be longer')
    })

    test('POST / existing account', async () => {
        let response = await request.makePost(config.api.register,
            {
                "email": config.testAccount.email, "password": config.testAccount.password,
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('EMAIL_ALREADY_EXISTS')
    })

    test('POST / missing email field', async () => {
        let response = await request.makePost(config.api.register,
            {
                "password": faker.internet.password()
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: email: Please fill in your email')
    })

    test('POST / missing password field', async () => {
        let response = await request.makePost(config.api.register,
            {
                "email": faker.internet.email()
            })
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('User validation failed: password: Password should be longer')
    })

    test('POST / successful', async () => {
        const email = faker.internet.email()
        let response = await request.makePost(config.api.register,
            {
                "email": email, "password": faker.internet.password(),
                "language": "vn", "gender": "M"
            })
        expect(response.status).toEqual(200)
        expect(response.data.email).toEqual(email)
        expect(response.data.accountCredit).toEqual(0)
        expect(response.data.language).toEqual('vn')
        expect(response.data.provider).toEqual('local')
        expect(response.data.state).toEqual('confirmed')
        expect(response.data.id).not.toHaveLength(0)
    })
})

describe('Forgot password API', () => {
    test('POST / empty email', async () => {
        let response = await request.makePost(config.api.forgot, { "email": "" })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('NO_EMAIL_PROVIDED')
    })

    test('POST / missing email field', async () => {
        let response = await request.makePost(config.api.forgot, {})
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('NO_EMAIL_PROVIDED')
    })

    test('POST / non-existing email', async () => {
        let response = await request.makePost(config.api.forgot, { "email": faker.internet.email() })
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('EMAIL_NOT_EXIST')
    })

    test('POST / Facebook email', async () => {
        let response = await request.makePost(config.api.forgot, { "email": config.testAccount.facebook })
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('COULD_NOT_RESET_OF_FACEBOOK_ACCOUNT')
    })

    test('POST / existing email', async () => {
        let response = await request.makePost(config.api.forgot, { "email": config.testAccount.email })
        if (config.baseUrl != 'https://www.leflair.vn') {
            expect(response.status).toEqual(400)
            expect(response.data.message).toEqual('COULD_NOT_SEND_EMAIL')
        } else {
            expect(response.status).toEqual(200)
            expect(response.data.message).toEqual('RESET_LINK_HAS_BEEN_SENT')
        }
    })
})

describe('Update password API', () => {
    test.each([[faker.internet.password(), faker.internet.password()],
    ["", faker.internet.password()],
    [faker.internet.password(), ""]])
        ('PUT / cannot change password - current: %s - new: %s',
        async (currentPassword: string, newPassword: string) => {
            let cookie = await request.getLogInCookie()
            let response = await request.makePut(config.api.password,
                {
                    "currentPassword": currentPassword,
                    "newPassword": newPassword
                },
                cookie)
            expect(response.status).toEqual(400)
            expect(response.data.message).toEqual('COULD_NOT_CHANGE_PASSWORD')
        })

    test.each([[""], ["123"]])('PUT / length < 7 new password - new: %s',
        async (newPassword: string) => {
            let cookie = await request.getLogInCookie()
            let response = await request.makePut(config.api.password,
                {
                    "currentPassword": config.testAccount.password,
                    "newPassword": newPassword
                },
                cookie)
            expect(response.status).toEqual(500)
            expect(response.data).toMatch('ValidationError: User validation failed: password: Password should be longer')
        })

    test('PUT / access denied', async () => {
        let response = await request.makePut(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": config.testAccount.password
            },
            'connect-id=assdfds')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })

    test('PUT / can change password', async () => {
        let cookie = await request.getLogInCookie()
        let response = await request.makePut(config.api.password,
            {
                "currentPassword": config.testAccount.password,
                "newPassword": config.testAccount.password
            },
            cookie)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('PASSWORD_CHANGED')
    })
})

describe('Update info API', () => {
    test('PUT / can change name', async () => {
        let cookie = await request.getLogInCookie()
        let response = await request.makePut(config.api.account,
            { "firstName": "first", "lastName": "last" },
            cookie)
        expect(response.status).toEqual(200)
        expect(response.data.firstName).toEqual('first')
        expect(response.data.lastName).toEqual('last')
    })

    test('PUT / cannot change to another existing email', async () => {
        let cookie = await request.getLogInCookie()
        let response = await request.makePut(config.api.account,
            { "email": config.testAccount.facebook },
            cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('USER_UPDATE_ERROR')
    })
})