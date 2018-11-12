import config from '../../config/config'
import { Utils } from '../../common'
let request = new Utils()
import * as faker from 'faker'

describe('Forgot password API ' + config.baseUrl, () => {
    test('POST / empty email', async () => {
        let response = await request.post(config.api.forgot, { "email": "" })
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('NO_EMAIL_PROVIDED')
    })

    test('POST / missing email field', async () => {
        let response = await request.post(config.api.forgot, {})
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('NO_EMAIL_PROVIDED')
    })

    test('POST / non-existing email', async () => {
        let response = await request.post(config.api.forgot, { "email": faker.internet.email() })
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('EMAIL_NOT_EXIST')
    })

    test('POST / Facebook email', async () => {
        let response = await request.post(config.api.forgot, { "email": config.testAccount.facebook })
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('COULD_NOT_RESET_OF_FACEBOOK_ACCOUNT')
    })

    test('POST / existing email', async () => {
        let response = await request.post(config.api.forgot, { "email": config.testAccount.email })
        if (config.baseUrl != 'https://www.leflair.vn') {
            expect(response.status).toEqual(400)
            expect(response.data.message).toEqual('COULD_NOT_SEND_EMAIL')
        } else {
            expect(response.status).toEqual(200)
            expect(response.data.message).toEqual('RESET_LINK_HAS_BEEN_SENT')
        }
    })
})