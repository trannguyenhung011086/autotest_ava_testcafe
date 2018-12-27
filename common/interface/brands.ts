export type brands = {
  '0-9': BrandItem[],
  A: BrandItem[],
  B: BrandItem[],
  C: BrandItem[],
  D: BrandItem[],
  E: BrandItem[],
  F: BrandItem[],
  G: BrandItem[],
  H: BrandItem[],
  I: BrandItem[],
  J: BrandItem[],
  K: BrandItem[],
  L: BrandItem[],
  M: BrandItem[],
  N: BrandItem[],
  O: BrandItem[],
  P: BrandItem[],
  Q: BrandItem[],
  R: BrandItem[],
  S: BrandItem[],
  T: BrandItem[],
  U: BrandItem[],
  V: BrandItem[],
  W: BrandItem[],
  X: BrandItem[],
  Y: BrandItem[],
  Z: BrandItem[]
}

export type BrandInfo = {
  id: string,
  name: string,
  description: string,
  products: ProductProps[],
  meta: {
    title: string,
    description: string,
    content: string
  }
}

export type ProductProps = {
  id: string,
  title: string,
  image: string,
  image2: string,
  retailPrice: number,
  salePrice: number,
  soldOut: boolean,
  gender?: string,
  category?: string,
  color?: string,
  size?: string,
  brand: string,
  queryParams?: string,
  slug: string,
  quantity: number,
  numberOfVariations: number,
}

export type BrandItem = {
  id: string,
  name: string,
  description?: string,
  slug: string,
  logo?: string
}