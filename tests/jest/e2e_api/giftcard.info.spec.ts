import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as model from '../../../common/interface'

let cookie: string
let giftCard: model.Giftcard
let giftcardInfo: model.GiftcardModel

let helper = new Utils.Helper
let access = new Utils.DbAccessUtils

export const GiftcardTest = () => {
    beforeAll(async () => {
        cookie = await helper.getLogInCookie(config.testAccount.email, config.testAccount.password)
    })

    it('GET / check invalid giftcard', async () => {
        let res = await helper.get(config.api.giftcard + 'INVALID-ID', cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('COULD_NOT_LOAD_GIFTCARD_OR_INVALID')
    })

    it('GET / check redeemed giftcard', async () => {
        giftcardInfo = await access.getGiftCard({ redeemed: true })

        let res = await helper.get(config.api.giftcard + giftcardInfo.code, cookie)

        expect(res.statusCode).toEqual(500)
        expect(res.body.message).toEqual('COULD_NOT_LOAD_GIFTCARD_OR_INVALID')
    })

    it('GET / check not redeemed giftcard', async () => {
        giftcardInfo = await access.getGiftCard({ redeemed: false })

        let res = await helper.get(config.api.giftcard + giftcardInfo.code, cookie)
        giftCard = res.body

        expect(res.statusCode).toEqual(200)
        expect(giftCard.code).toEqual(giftcardInfo.code)
        expect(giftCard.id).not.toBeEmpty()
        expect(giftCard.amount).toBeGreaterThan(0)
    })

    it('GET / cannot check giftcard with invalid cookie', async () => {
        let res = await helper.get(config.api.giftcard + 'CARD-ID', 'leflair.connect2.sid=test')

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('Access denied.')
    })

    it('GET / cannot check giftcard without login', async () => {
        await helper.get(config.api.signOut, cookie)
        let res = await helper.get(config.api.giftcard + 'CARD-ID', cookie)

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('Access denied.')
    })
}

describe('Giftcard API ' + config.baseUrl + config.api.giftcard, GiftcardTest)