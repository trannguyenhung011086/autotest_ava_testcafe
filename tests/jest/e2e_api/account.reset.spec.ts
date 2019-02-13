import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import faker from "faker/locale/vi"

export const AccountResetTest = () => {
    it('POST / empty password', async () => {
        let res = await request.post(config.api.reset, {
            "password": "",
            "token": "TEST_TOKEN"
        })
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('RESET_INVALID_PASSWORD')
    })

    it('POST / password with length < 7', async () => {
        let res = await request.post(config.api.reset, {
            "password": "123456",
            "token": "TEST_TOKEN"
        })
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('RESET_INVALID_PASSWORD')
    })

    it('POST / invalid token', async () => {
        let res = await request.post(config.api.reset, {
            "password": "123456789",
            "token": faker.random.uuid
        })
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('COULD_NOT_CHANGE_PASSWORD_TOKEN_EXPIRED')
    })
}

describe('Reset password API ' + config.baseUrl + config.api.reset, AccountResetTest)