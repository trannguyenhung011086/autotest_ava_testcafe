import * as cart from './cart'
import * as address from './addresses'

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

export interface Customer {
    address: {
        billing: address.Billing[]
        shipping: address.Shipping[]
    };
    firstName: string
    lastName: string
    email: string
    nsId?: string
    password: string
    gender: string
    language: string
    availableCredit: number
    refundedCredit: number
    accountCredit: number
    provider: string
    providerData?: any
    additionalProvidersData?: {
        facebook?: any
    }
    state: string
    preview?: boolean
    stripe?: {
        customerId: string
    }
    _id: string
}