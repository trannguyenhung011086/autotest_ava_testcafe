export type OrderSummary = {
    id: string,
    code: string,
    createdDate: string,
    shippedDate?: string,
    deliveredDate?: string,
    status: string
}

export type PaymentSummary = {
    method: string,
    subtotal: number,
    shipping: number,
    total: number,
    accountCredit: number,
    card: {
        type: string,
        lastDigits: string,
    },
    voucherAmount: number,
}

export type OrderedProductBrand = {
    name: string,
    _id: string
}

export type OrderedProduct = {
    id: string,
    productContentId: string,
    productId: string,
    title: string,
    image: string,
    retailPrice: number,
    salePrice: number,
    quantity: number,
    totalSalePrice: number,
    returnable: boolean,
    type: string,
    color?: string,
    size?: string,
    brand: OrderedProductBrand,
    slug?: string,
    queryParams?: string,
    nsId?: string,
}

export type Address = {
    address: string,
    city: string,
    district: string,
    firstName: string,
    lastName: string,
    phone: string
}

export type Order = {
    _id: string,
    id: string,
    code: string,
    user: string,
    paymentSummary: PaymentSummary,
    address: {
        billing: Address,
        shipping: Address,
    },
    status: string,
    products: OrderedProduct[],
    createdDate: string,
    createdTimestamp: number,
    shippedDate?: string,
    deliveredDate?: string,
    tracking?: string,
    isFirstOrder?: boolean,
    isBulky?: boolean,
    isVirtual?: boolean,
    isCrossBorder?: boolean,
}