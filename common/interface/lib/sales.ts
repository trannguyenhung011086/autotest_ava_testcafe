export type Products = {
    id: string
    title: string,
    image: string,
    image2: string,
    retailPrice: number,
    salePrice: number,
    soldOut: boolean,
    category: string,
    color: string,
    brand: string,
    size: string,
    queryParams: string,
    slug: string,
    quantity: number,
    numberOfVariations: number,
    product: string,
    isSecretSale: boolean,
    nsId: string
}

export type Product = {
    id: string,
    nsId: string,
    name: string,
    size: string,
    color: string,
    retailPrice: number,
    salePrice: number,
    saleId: string,
    inStock: boolean,
    imageKey: string,
    quantity: number,
    isVirtual?: boolean,
    isBulky?: boolean,
    _id: string
}

export type ProductDescription = {
    heading: string,
    secondary: Array<{ header: string, data: string[] }>,
    materialCare?: Array<{ header: string, data: string[] }>,
    sizeFit?: Array<{ header: string, data: string[] }>
}

export type Brand = {
    name: string,
    logo: string,
    description: string
}

export type OngoingSale = {
    id: string,
    title: string,
    slug: string,
    startTime: Date,
    endTime: Date,
    potd: boolean,
    categories: string[]
}

export type UpcomingSale = {
    id: string,
    title: string,
    image: string,
    slug: string,
    potd: boolean,
    categories: string[],
    international: boolean
}

export type UpcomingInfo = {
    id: string,
    title: string,
    description: string,
    image: string,
    startTime: Date
}

export type Filter = {
    value: string
    display: string
}

export type Size = {
    availableColors: string[],
    name: string,
    quantity: number,
    soldOut: boolean
}

export type Color = {
    name: string,
    hex?: string,
    soldOut: boolean,
    availableSizes: string[]
}

export interface FilterModel {
    gender: Filter[]
    type: Filter[]
    color: Filter[]
    size: Filter[]
    brand: Filter[]
    category: Filter[]
}

export interface SalesModel {
    id: string
    title: string
    endTime: string
    image?: string
    image1?: string
    image2?: string
    image3?: string
    image4?: string
    slug: string
    categories: string[]
    potd: boolean
    international: boolean
    product?: {
        id: string,
        brand: string,
        title: string,
        salePrice: number,
        retailPrice: number,
        images: string[]
    }
}

export interface UpcomingSalesModel {
    date: string
    year: string
    sales: UpcomingSale[]
}

export interface SaleInfoModel {
    id: string
    title: string
    startTime: Date
    endTime: string
    products: Products[]
    filter: FilterModel
    sort: string[]
    campaign: boolean
    slug: string
    _id: string
}

export interface ProductInfoModel {
    id: string
    sale: OngoingSale
    brand: Brand
    title: string
    returnable: boolean
    returnDays: number
    description: ProductDescription
    images: { [key: string]: string[] }
    sizeChart?: Array<{ name: string, values: string[] }>
    colors?: Color[]
    sizes?: Size[]
    products: Product[],
    variations: Product[],
    name: string
}

export interface BestSellers {
    id: string
    title: string
    brand: string
    salePrice: number
    retailPrice: number
    category: string
    image: string
    image2: string
    cr: number
    slug: string
    international: boolean
    isNewEvent: boolean
    nsId: string
    quantity: number
    queryParams: string
    variation: string
    variationId: string
    views: string
}

export type Banner = {
    image: string,
    url: string
}

export interface Home {
    today: SalesModel[]
    featured: SalesModel[]
    current: SalesModel[]
    potd: SalesModel[]
    banners: Banner[]
    upcoming: UpcomingSalesModel[]
}