export type Voucher = {
    id: string,
    code: string,
    amount: number,
    discountType: string,
    freeShipping: boolean,
    minimumPurchase: number,
    binRange?: Array<number[]>,
    specificDays?: number[],
    maximumDiscountAmount?: number,
    numberOfItems?: number
}

export interface VoucherModel {
    code: string
    campaign: string
    webCampaign: string

    expiry: Date
    used: boolean

    discountType: string
    amount: number
    minimumPurchase: number

    sale: string
    customer: string

    freeShipping: boolean
    multipleUser: boolean
    oncePerAccount: boolean
    oncePerAccountForCampaign: boolean
    binRange?: string

    maximumDiscountAmount: number
    numberOfUsage: number
    specificDays?: number[]
    numberOfItems?: number
}
