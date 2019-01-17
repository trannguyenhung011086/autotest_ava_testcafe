import config from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import faker from "faker/locale/vi"

describe('Reset password API ' + config.baseUrl + config.api.reset, () => {
    it('POST / empty password', async () => {
        let response = await request.post(config.api.reset, 
            { "password": "", "token": "TEST_TOKEN"})
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('RESET_INVALID_PASSWORD')
    })

    it('POST / password with length < 7', async () => {
        let response = await request.post(config.api.reset, 
            { "password": "123456", "token": "TEST_TOKEN"})
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('RESET_INVALID_PASSWORD')
    })

    it('POST / invalid token', async () => {
        let response = await request.post(config.api.reset, 
            { "password": "123456789", "token": faker.random.uuid})
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('COULD_NOT_CHANGE_PASSWORD_TOKEN_EXPIRED')
    })
})