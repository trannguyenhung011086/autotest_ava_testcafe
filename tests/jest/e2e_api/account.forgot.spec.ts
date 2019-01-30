import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import faker from "faker/locale/vi"

export const AccountForgotTest = () => {
    it('POST / empty email', async () => {
        let response = await request.post(config.api.forgot, { "email": "" })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('EMAIL_ADDRESS_REQUIRED')
    })

    it('POST / missing email field', async () => {
        let response = await request.post(config.api.forgot, {})
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('EMAIL_ADDRESS_REQUIRED')
    })

    it('POST / non-existing email', async () => {
        let response = await request.post(config.api.forgot, { "email": 'QA_' + faker.internet.email() })
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('EMAIL_NOT_EXIST')
    })

    it('POST / wrong format email', async () => {
        let response = await request.post(config.api.forgot, { "email": ".test%!@#$%^&*()_+<>?@mail.com" })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('REGISTER_INVALID_EMAIL')
    })

    it('POST / Facebook email', async () => {
        let response = await request.post(config.api.forgot, { "email": "trannguyenhung011086@gmail.com" })
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('COULD_NOT_RESET_OF_FACEBOOK_ACCOUNT')
    })

    it('POST / existing email', async () => {
        let response = await request.post(config.api.forgot, { "email": config.testAccount.email })
        if (config.baseUrl != 'https://www.leflair.vn') {
            expect(response.status).toEqual(400)
            expect(response.data.message).toEqual('COULD_NOT_SEND_EMAIL')
        } else {
            expect(response.status).toEqual(200)
            expect(response.data.message).toEqual('RESET_LINK_HAS_BEEN_SENT')
        }
    })
}

describe('Forgot password API ' + config.baseUrl + config.api.forgot, AccountForgotTest)