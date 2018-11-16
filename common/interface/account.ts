import * as cart from './cart'

export interface Account {
    id: string
    firstName: string
    lastName: string
    email: string
    language: string
    accountCredit: number
    provider: string
    state: string
    preview: boolean
    stripe: object
    nsId: string
    gender: string
    cart: cart.Cart[]
}