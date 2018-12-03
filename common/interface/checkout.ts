import * as cart from '../interface/cart'
import * as creditcard from '../interface/creditcard'

export interface Checkout {
    accountCredit: number
    cart: cart.Cart[]
    creditCards: creditcard.CreditCardModel[]
}

export interface StripeSource {
    id: string
    object: string
    amount?: number
    card: {
        exp_month: number
        exp_year: number
        brand: string
        country: string
        cvc_check: string
        funding: string
        last4: string
        three_d_secure: string
        name?: string
        address_line1_check?: string
        address_zip_check?: string
        tokenization_method?: string
        dynamic_last4?: string
    }
    client_secret: string
    created: number
    currency?: string
    flow: string
    livemode: boolean
    metadata: {
    }
    owner: {
        address?: string
        email?: string
        name?: string
        phone?: string
        verified_address?: string
        verified_email?: string
        verified_name?: string
        verified_phone?: string
    }
    statement_descriptor?: string
    status: string
    type: string
    usage: string
}
