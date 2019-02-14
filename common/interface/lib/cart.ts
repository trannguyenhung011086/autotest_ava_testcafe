export type CartBrand = {
    _id: string,
    createdAt: Date,
    updatedAt: Date,
    __v: number,
    description: string,
    logo: string,
    name: string
}

export interface Cart {
    id: string
    productContentId: string
    productId: string
    title: string
    brand: CartBrand
    image: string
    quantity: number
    salePrice: number
    retailPrice: number
    availableQuantity: number
    slug: string
    categories: string[]
    international: boolean
    country: string
    saleEnded: boolean
    nsId: string
}