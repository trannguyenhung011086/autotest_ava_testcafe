import * as cart from '../interface/cart'
import * as creditcard from '../interface/creditcard'

export interface Checkout {
    accountCredit: number
    cart: cart.Cart[]
    creditCards: creditcard.CreditCardModel[]
}