import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as model from '../../common/interface'
let cookie: string
let giftCard: model.Giftcard
let giftcardInfo: model.GiftcardModel

describe('Giftcard API ' + config.baseUrl + config.api.giftcard, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    test('GET / check invalid giftcard', async () => {
        let response = await request.get(config.api.giftcard + 'INVALID-ID')
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_LOAD_GIFTCARD_OR_INVALID')
    })

    test('GET / check redeemed giftcard', async () => {
        giftcardInfo = await access.getGiftCard({ redeemed: true })
        let response = await request.get(config.api.giftcard + giftcardInfo.code)
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_LOAD_GIFTCARD_OR_INVALID')
    })

    test('GET / check not redeemed giftcard', async () => {
        giftcardInfo = await access.getGiftCard({ redeemed: false })
        let response = await request.get(config.api.giftcard + giftcardInfo.code)
        giftCard = response.data
        expect(response.status).toEqual(200)
        expect(giftCard.code).toEqual(giftcardInfo.code)
        expect(giftCard.id).not.toBeEmpty()
        expect(giftCard.amount).toBeGreaterThan(0)
    })

    test('GET / cannot check giftcard with invalid cookie', async () => {
        let response = await request.get(config.api.giftcard + 'CARD-ID', 'abc')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })

    test('GET / cannot check giftcard without login', async () => {
        await request.get(config.api.logout)
        let response = await request.get(config.api.giftcard + 'CARD-ID')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })
})