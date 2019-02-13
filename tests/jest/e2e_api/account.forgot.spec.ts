import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import faker from "faker/locale/vi"

export const AccountForgotTest = () => {
    it('POST / empty email', async () => {
        let res = await request.post(config.api.forgot, {
            "email": ""
        })
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('EMAIL_ADDRESS_REQUIRED')
    })

    it('POST / missing email field', async () => {
        let res = await request.post(config.api.forgot, {})
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('EMAIL_ADDRESS_REQUIRED')
    })

    it('POST / non-existing email', async () => {
        let res = await request.post(config.api.forgot, {
            "email": 'QA_' + faker.internet.email()
        })
        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('EMAIL_NOT_EXIST')
    })

    it('POST / wrong format email', async () => {
        let res = await request.post(config.api.forgot, {
            "email": ".test%!@#$%^&*()_+<>?@mail.com"
        })
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('REGISTER_INVALID_EMAIL')
    })

    it('POST / Facebook email', async () => {
        let res = await request.post(config.api.forgot, {
            "email": "trannguyenhung011086@gmail.com"
        })
        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('COULD_NOT_RESET_OF_FACEBOOK_ACCOUNT')
    })

    it('POST / existing email', async () => {
        let res = await request.post(config.api.forgot, {
            "email": config.testAccount.email
        })
        
        if (config.baseUrl != 'https://www.leflair.vn') {
            expect(res.statusCode).toEqual(400)
            expect(res.body.message).toEqual('COULD_NOT_SEND_EMAIL')
        } else {
            expect(res.statusCode).toEqual(200)
            expect(res.body.message).toEqual('RESET_LINK_HAS_BEEN_SENT')
        }
    })
}

describe('Forgot password API ' + config.baseUrl + config.api.forgot, AccountForgotTest)