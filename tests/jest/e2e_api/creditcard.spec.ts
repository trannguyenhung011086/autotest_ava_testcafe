import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as model from '../../../common/interface'
let cookie: string
let creditcards: model.CreditCard[]
import waitForExpect from 'wait-for-expect'

export const CreditCardTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    it('GET / can access creditcard info', async () => {
        let res = await request.get(config.api.creditcard, cookie)
        creditcards = res.body

        expect(res.statusCode).toEqual(200)
        for (let card of creditcards) {
            expect(card.cardholderName).not.toBeEmpty()
            expect(card.id).not.toBeEmpty()
            expect(card.lastDigits).toMatch(/\d{4}/)
            expect(card.type.toLowerCase()).toMatch(/visa|master/)
            if (card.provider) {
                expect(card.provider).toEqual('STRIPE')
            }
        }
    })

    it('DELETE / can delete creditcard', async () => {
        let res = await request.get(config.api.creditcard, cookie)
        creditcards = res.body

        if (creditcards.length > 0) {
            res = await request.delete(config.api.creditcard + '/' + creditcards[0].id, cookie)
            await waitForExpect(() => {
                expect(res.statusCode).toEqual(200)
                expect(res.body).toBeTrue()
            })
        }
    })

    it('DELETE / cannot delete invalid creditcard', async () => {
        let res = await request.get(config.api.creditcard, cookie)
        creditcards = res.body

        res = await request.delete(config.api.creditcard + '/INVALID-ID')
        await waitForExpect(() => {
            expect(res.statusCode).toEqual(500)
            expect(res.body.message).toEqual('INVALID_CREDIT_CARD_OR_CANNOT_DELETE')
        })
    })

    it('GET / cannot access creditcard info with invalid cookie', async () => {
        let res = await request.get(config.api.creditcard, 'abc=abc')
        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('Access denied.')
    })

    it('GET / cannot access creditcard info without login', async () => {
        await request.get(config.api.signOut, cookie)
        let res = await request.get(config.api.creditcard, cookie)

        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('Access denied.')
    })
}

describe('Creditcard info API ' + config.baseUrl + config.api.creditcard, CreditCardTest)