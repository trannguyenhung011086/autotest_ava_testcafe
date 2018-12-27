import * as brand from '../interface/brands'

export interface EventCache {
    id: string
    title: string
    description: string
    variations: Variation[]
    event: EventItem
    brand: brand.BrandItem
    category: Category
    type: EventType
}

export type Variation = {
    id: string,
    nsId: string,
    barcode?: string,
    image: string,
    image2: string,
    color?: string
}

export type EventItem = {
    id: string,
    startDate: Date,
    endDate: Date,
    featured: boolean,
    potd: boolean,
    potdId?: string,
    campaignId?: string,
    categories: string[]
}

export type Category = {
    name: string,
    id: string,
    nsId: string
}

export type EventType = {
    name: string,
    id: string
}

export interface ItemCache {
    total: number
    list: ListItem[]
}

export type ListItem = {
    quantity: number,
    retailPrice: number,
    salePrice: number,
    nsId: string
}