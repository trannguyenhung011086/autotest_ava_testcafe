import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as model from '../../../common/interface'
let cookie: string
let giftCard: model.Giftcard
let giftcardInfo: model.GiftcardModel

export const GiftcardTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    it('GET / check invalid giftcard', async () => {
        let response = await request.get(config.api.giftcard + 'INVALID-ID')
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_LOAD_GIFTCARD_OR_INVALID')
    })

    it('GET / check redeemed giftcard', async () => {
        giftcardInfo = await access.getGiftCard({ redeemed: true })
        let response = await request.get(config.api.giftcard + giftcardInfo.code)
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_LOAD_GIFTCARD_OR_INVALID')
    })

    it('GET / check not redeemed giftcard', async () => {
        giftcardInfo = await access.getGiftCard({ redeemed: false })
        let response = await request.get(config.api.giftcard + giftcardInfo.code)
        giftCard = response.data
        expect(response.status).toEqual(200)
        expect(giftCard.code).toEqual(giftcardInfo.code)
        expect(giftCard.id).not.toBeEmpty()
        expect(giftCard.amount).toBeGreaterThan(0)
    })

    it('GET / cannot check giftcard with invalid cookie', async () => {
        let response = await request.get(config.api.giftcard + 'CARD-ID', 'abc')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })

    it('GET / cannot check giftcard without login', async () => {
        await request.get(config.api.signOut)
        let response = await request.get(config.api.giftcard + 'CARD-ID')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })
}

describe('Giftcard API ' + config.baseUrl + config.api.giftcard, GiftcardTest)