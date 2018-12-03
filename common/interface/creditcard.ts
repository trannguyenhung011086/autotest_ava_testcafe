export type CreditCard = {
    id: string
    type: string
    lastDigits: string
    cardholderName: string
    provider?: string
}

export interface CreditCardModel {
    _id: string
    accountType: string
    accountId?: string
    lastDigits: string
    cardHolder: string
    token: string
    status: string
    mpMemberId: string
    user: string
    provider?: string
    id: string
}
