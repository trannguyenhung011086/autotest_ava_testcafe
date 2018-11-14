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
    queryParams: string,
    slug: string,
    quantity: number,
    numberOfVariations: number
}

export type Product = {
    id: string,
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

export type Sale = {
    id: string,
    title: string,
    slug: string,
    startTime: Date,
    endTime: Date,
    potd: boolean,
    categories: string[]
}

export type Filter = {
    value: string
    display: string
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
    image: string
    image2: string
    image4: string
    slug: string
    categories: string[]
    potd: boolean,
    international: boolean
}

export interface SaleInfoModel {
    id: string
    title: string
    startTime: Date
    endTime: Date
    products: Products[]
    filter: FilterModel
    sort: string[]
    image: string
    campaign: boolean
    slug: string
}

export interface ProductInfoModel {
    id: string
    sale: Sale
    brand: Brand
    title: string
    returnable: boolean
    returnDays: number
    description: ProductDescription
    images: { All: string[] }
    sizeChart?: Array<{ name: string, values: string[] }>
    colors?: Array<{ name: string, hex?: string, hex2?: string, soldOut: boolean, availableSizes: string[] }>
    sizes?: Array<{ name: string, soldOut: boolean, availableColors: string[] }>
    products: Product[]
}
