import { Cart } from './cart'
import { CreditCardModel } from './creditcard'
import { OrderedProduct } from './orders'
import { Account } from './account'
import { Addresses } from './addresses'

export interface Checkout {
    accountCredit: number
    cart: Cart[]
    creditCards: CreditCardModel[]
}

export interface FailedAttempt extends Checkout {
    address: {
        billing: Addresses["billing"],
        shipping: Addresses["shipping"]
    }
    code: string
    email: string
    orderId: string
    products: OrderedProduct[]
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

export type PayDollarCreditCard = {
    lang: string,
    currCode: string,
    payType: string,
    merchantId: string,
    orderRef: string,
    amount: number,
    transactionUrl: string,
    memberPay_service: string,
    memberPay_memberId?: string,
    cardHolder?: string,
    cardNo?: string,
    pMethod?: string,
    epMonth?: number,
    epYear?: number,
    securityCode?: string,
    failUrl?: string,
    errorUrl?: string,
    successUrl?: string
}

export interface CheckoutOrder {
    orderId: string
    code: string
    creditCard?: PayDollarCreditCard
    cardService?: string
}

export interface PayDollarResponse {
    successcode: string
    Ref: string
    PayRef: string
    Amt: string
    Cur: string
    prc: string
    src: string
    Ord: string
    Holder: string
    AuthId: string
    TxTime: string
    errMsg: string
}

export interface CheckoutInput {
    account?: Account
    addresses?: Addresses
    voucherId?: string
    credit?: number
    stripeSource?: any
    saveNewCard?: boolean
    methodData?: string
    cart?: any[]
    orderCode?: string
}