export interface FacebookFeeds {
    availability: string
    brand: string
    condition: string
    description: string
    id: string
    image_link: string
    link: string
    price: string
    sale_price: string
    sale_price_effective_date: string
    title: string
}

export interface GoogleFeeds {
    'Page URL': string
    'Custom label': string
}

export interface GoogleDynamicFeeds {
    'Final URL': string
    'Final mobile URL': string
    ID: string
    'Image URL': string
    'Item category': string
    'Item description': string
    'Item title': string
    Price: string
    'Sale price': string
}