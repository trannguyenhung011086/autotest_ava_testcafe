export interface GiftcardModel {
    code: string
    amount: number
    redeemed: boolean
    usedBy: string
    expiry: Date
}

export type Giftcard = {
    id: string,
    code: string,
    amount: number
}
