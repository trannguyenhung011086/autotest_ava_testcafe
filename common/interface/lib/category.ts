export type DisplayName = {
    vn: string,
    en: string
}

export type Slug = {
    vn: string,
    en: string
}

export type Subitem = {
    id: string,
    name: string,
    displayName: DisplayName,
    salesCount: number,
    slug: Slug,
    type: string
}

export interface CategoryMenu {
    id: string
    name: string
    displayName: DisplayName
    type: string
    subitems: Subitem[]
    parent: {
        id: string
        displayName: DisplayName
    }
    slug: Slug
}

export interface TopMenu {
    id: string
    code: string
    name: string
    displayName: DisplayName
    description: string
    items: Subitem[]
}