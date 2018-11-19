import * as cart from './cart'

export interface SignIn {
    id: string
    firstName: string
    lastName: string
    email: string
    language: string
    accountCredit: number
    provider: string
    state: string
    preview: boolean
    nsId: string
    gender: string
    cart: cart.Cart[]
}

export interface Account extends SignIn {
    stripe: object
}